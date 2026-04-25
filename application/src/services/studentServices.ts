import { StudentDTO } from "@dtos/student";
import { Group } from "@models/group";
import { Student } from "@models/student";
import { Subscription } from "@models/subscription";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

export class StudentServices {
  create = async (studentData: Partial<StudentDTO>) => {
    const existingStudent = await Student.count({
      where: { phone: studentData.phone },
    });

    if (existingStudent > 0) throw logger.error("Student Already exists", 409);

    const group = await Group.findByPk(studentData.groupId);
    if (!group) throw logger.error("Group not found", 404);

    const activeStudentsInGroup = await Student.count({
      where: { groupId: studentData.groupId, enrollment: "ACTIVE" },
    });

    if (activeStudentsInGroup >= group.maxCapacity) {
      throw logger.error("Group has reached maximum capacity", 400);
    }

    const createStudent = await Student.create(studentData);

    return responseFormat({
      message: "Student created succesfully",
      statusCode: 201,
      data: createStudent,
    });
  };

  get = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) throw logger.error("Student not found", 404);

    return responseFormat({
      message: "Student found successfully",
      statusCode: 200,
      data: student,
    });
  };

  getAll = async () => {
    const students = await Student.findAll();
    if (students.length === 0) throw logger.error("Students not found", 404);

    return responseFormat({
      message: "Students found successfully",
      statusCode: 200,
      data: students,
    });
  };

  update = async (id: string, studentData: Partial<StudentDTO>) => {
    const student = await Student.findByPk(id);
    if (student === null) throw logger.error("Student not found", 404);
    if (studentData.phone && studentData.phone !== student.phone) {
      const existingStudent = await Student.findOne({
        where: { phone: studentData.phone },
      });

      if (existingStudent) throw logger.error("Phone already in use", 409);
    }

    const changingGroup =
      studentData.groupId && studentData.groupId !== student.groupId;
    const activatingStudent =
      studentData.enrollment === "ACTIVE" && student.enrollment !== "ACTIVE";

    if (changingGroup || activatingStudent) {
      const targetGroupId = studentData.groupId || student.groupId;

      const group = await Group.findByPk(targetGroupId);
      if (!group) throw logger.error("Group not found", 404);

      const activeStudentsInGroup = await Student.count({
        where: { groupId: targetGroupId, enrollment: "ACTIVE" },
      });

      if (activeStudentsInGroup >= group.maxCapacity) {
        throw logger.error("Group has reached maximum capacity", 400);
      }
    }

    const updatedStudent = await student.update(studentData);

    return responseFormat({
      message: "Student updated succesfully",
      statusCode: 200,
      data: updatedStudent,
    });
  };

  delete = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) throw logger.error("Student not found", 404);
    await student.update({ isActive: false, enrollment: "INACTIVE" });

    await Subscription.update(
      { status: "CANCELLED" },
      { where: { studentId: id, status: "ACTIVE" } },
    );

    return responseFormat({
      message: "Student deactivated succesfully",
      statusCode: 200,
    });
  };
}
