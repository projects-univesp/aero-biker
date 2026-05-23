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

    if (existingStudent > 0)
      responseFormat.error("Student Already exists", 409);

    const group = await Group.findByPk(studentData.groupId);
    if (!group) responseFormat.error("Group not found", 404);

    const activeStudentsInGroup = await Student.count({
      where: { groupId: studentData.groupId, enrollment: "ACTIVE" },
    });

    if (activeStudentsInGroup >= group.maxCapacity) {
      responseFormat.error("Group has reached maximum capacity", 400);
    }

    const createStudent = await Student.create(studentData);

    return responseFormat.send({
      message: "Student created succesfully",
      statusCode: 201,
      data: createStudent,
    });
  };

  get = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) responseFormat.error("Student not found", 404);

    return responseFormat.send({
      message: "Student found successfully",
      statusCode: 200,
      data: student,
    });
  };

  getAll = async () => {
    const students = await Student.findAll();

    return responseFormat.send({
      message: "Students found successfully",
      statusCode: 200,
      data: students,
    });
  };

  update = async (id: string, studentData: Partial<StudentDTO>) => {
    const student = await Student.findByPk(id);
    if (student === null) responseFormat.error("Student not found", 404);
    if (studentData.phone && studentData.phone !== student.phone) {
      const existingStudent = await Student.findOne({
        where: { phone: studentData.phone },
      });

      if (existingStudent) responseFormat.error("Phone already in use", 409);
    }

    const changingGroup =
      studentData.groupId && studentData.groupId !== student.groupId;
    const activatingStudent =
      studentData.enrollment === "ACTIVE" && student.enrollment !== "ACTIVE";

    if (changingGroup || activatingStudent) {
      const targetGroupId = studentData.groupId || student.groupId;

      const group = await Group.findByPk(targetGroupId);
      if (!group) responseFormat.error("Group not found", 404);

      const activeStudentsInGroup = await Student.count({
        where: { groupId: targetGroupId, enrollment: "ACTIVE" },
      });

      if (activeStudentsInGroup >= group.maxCapacity) {
        responseFormat.error("Group has reached maximum capacity", 400);
      }
    }

    const updatedStudent = await student.update(studentData);

    return responseFormat.send({
      message: "Student updated succesfully",
      statusCode: 200,
      data: updatedStudent,
    });
  };

  toggleActive = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) responseFormat.error("Student not found", 404);

    const newStatus = !student.isActive;
    const newEnrollment = newStatus ? "ACTIVE" : "INACTIVE";

    if (newStatus) {
      const group = await Group.findByPk(student.groupId);
      if (group) {
        const activeCount = await Student.count({
          where: { groupId: student.groupId, enrollment: "ACTIVE" },
        });
        if (activeCount >= group.maxCapacity) {
          responseFormat.error("Group has reached maximum capacity", 400);
        }
      }
    }

    await student.update({ isActive: newStatus, enrollment: newEnrollment });

    return responseFormat.send({
      message: newStatus
        ? "Student activated successfully"
        : "Student deactivated successfully",
      statusCode: 200,
    });
  };

  delete = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) responseFormat.error("Student not found", 404);

    const linkedSubscriptions = await Subscription.count({
      where: { studentId: id },
    });

    if (linkedSubscriptions > 0) {
      responseFormat.error(
        "Cannot delete a student that has subscriptions linked to them",
        400,
      );
    }

    await student.destroy();

    return responseFormat.send({
      message: "Student deleted successfully",
      statusCode: 200,
    });
  };
}
