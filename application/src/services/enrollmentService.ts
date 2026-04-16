import { Enrollment } from "@models/enrollment";
import { EnrollmentDTO } from "@dtos/enrollment";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

export class EnrollmentService {
  create = async (enrollmentData: Partial<EnrollmentDTO>) => {
    const existingEnrollment = await Enrollment.count({
      where: { studentId: enrollmentData.studentId, groupId: enrollmentData.groupId, status: "ACTIVE" },
    });

    if (existingEnrollment > 0)
      throw logger.error("Enrollment already active", 409);

    const createdEnrollment = await Enrollment.create(enrollmentData);

    return responseFormat({
      message: "Enrollment created succesfully",
      statusCode: 201,
      data: createdEnrollment,
    });
  };

  getAll = async () => {
    const enrollments = await Enrollment.findAll();

    if (enrollments.length === 0)
      throw logger.error("Enrollments not found", 404);

    return responseFormat({
      message: "Enrollments found successfully",
      statusCode: 200,
      data: enrollments,
    });
  };

  get = async (id: string) => {
    const enrollment = await Enrollment.findByPk(id);

    if (enrollment === null) throw logger.error("Enrollment not found", 404);

    return responseFormat({
      message: "Enrollment found successfully",
      statusCode: 200,
      data: enrollment,
    });
  };

  update = async (id: string, enrollmentData: Partial<EnrollmentDTO>) => {
    const enrollment = await Enrollment.findByPk(id);

    if (enrollment === null) throw logger.error("Enrollment not found", 404);

    const updatedEnrollment = await enrollment.update(enrollmentData);

    return responseFormat({
      message: "Enrollment updated succesfully",
      statusCode: 200,
      data: updatedEnrollment,
    });
  };

  delete = async (id: string) => {
    const enrollment = await Enrollment.findByPk(id);

    if (enrollment === null) throw logger.error("Enrollment not found", 404);

    await enrollment.update({ status: "INACTIVE" });

    return responseFormat({
      message: "Enrollment deleted succesfully",
      statusCode: 200,
    });
  };
}
