import { Student } from "@models/student";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

export class StudentServices {
  create = async (studentData: {
    name: string;
    phone: string;
    isActive: boolean;
  }) => {
    const existingStudent = await Student.count({
      where: { phone: studentData.phone },
    });

    if (existingStudent > 0) throw logger.error("Student Already exists", 409);
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
    if (students === null) throw logger.error("Students not found", 404);

    return responseFormat({
      message: "Students found successfully",
      statusCode: 200,
      data: students,
    });
  };

  update = async (
    id: string,
    studentData: { name: string; phone: string; isActive: boolean },
  ) => {
    const student = await Student.findByPk(id);
    if (student === null) throw logger.error("Student not found", 404);
    if (studentData.phone && studentData.phone !== student.phone) {
      const existingStudent = await Student.findOne({
        where: { email: studentData.phone },
      });

      if (existingStudent) throw logger.error("Phone already in use", 409);
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
    await student.update({ isActive: false });

    return responseFormat({
      message: "Student deactivated succesfully",
      statusCode: 200,
    });
  };
}
