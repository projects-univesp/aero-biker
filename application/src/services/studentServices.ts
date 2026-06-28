import { StudentDTO } from "@dtos/student";
import { Group } from "@models/group";
import { Student } from "@models/student";
import { Subscription } from "@models/subscription";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";

export class StudentServices {
  create = async (studentData: Partial<StudentDTO>) => {
    const existingStudent = await Student.count({
      where: { phone: studentData.phone },
    });

    if (existingStudent > 0) throw new AppError("Student Already exists", 409);

    const group = await Group.findByPk(studentData.groupId);
    if (!group) throw new AppError("Group not found", 404);

    const activeStudentsInGroup = await Student.count({
      where: { groupId: studentData.groupId, enrollment: "ACTIVE" },
    });

    if (activeStudentsInGroup >= group.maxCapacity) {
      throw new AppError("Group has reached maximum capacity", 400);
    }

    const createStudent = await Student.create(studentData);

    return createStudent;
  };

  get = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) throw new AppError("Student not found", 404);

    return student;
  };

  getAll = async () => {
    const students = await Student.findAll({
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["name"],
        },
      ],
    });
    return students;
  };

  update = async (id: string, studentData: Partial<StudentDTO>) => {
    const student = await Student.findByPk(id);
    if (student === null) throw new AppError("Student not found", 404);
    if (studentData.phone && studentData.phone !== student.phone) {
      const existingStudent = await Student.findOne({
        where: { phone: studentData.phone },
      });

      if (existingStudent) throw new AppError("Phone already in use", 409);
    }

    const changingGroup =
      studentData.groupId && studentData.groupId !== student.groupId;
    const activatingStudent =
      studentData.enrollment === "ACTIVE" && student.enrollment !== "ACTIVE";

    if (changingGroup || activatingStudent) {
      const targetGroupId = studentData.groupId || student.groupId;

      const group = await Group.findByPk(targetGroupId);
      if (!group) throw new AppError("Group not found", 404);

      const activeStudentsInGroup = await Student.count({
        where: { groupId: targetGroupId, enrollment: "ACTIVE" },
      });

      if (activeStudentsInGroup >= group.maxCapacity) {
        throw new AppError("Group has reached maximum capacity", 400);
      }
    }

    const updatedStudent = await student.update(studentData);

    return updatedStudent;
  };

  delete = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) throw new AppError("Student not found", 404);
    await student.update({ isActive: false, enrollment: "INACTIVE" });

    await Subscription.update(
      { status: "CANCELLED" },
      { where: { studentId: id, status: "ACTIVE" } },
    );
  };
}
