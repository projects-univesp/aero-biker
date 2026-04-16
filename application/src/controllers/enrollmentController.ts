import { Request, Response } from "express";
import { EnrollmentService } from "@services/enrollmentService";
import { VerifyData } from "@utils/zod";

export class EnrollmentController {
  private readonly enrollmentService: EnrollmentService;
  private readonly verifyData: VerifyData;

  constructor() {
    this.enrollmentService = new EnrollmentService();
    this.verifyData = new VerifyData();
  }

  createEnrollment = async (request: Request, response: Response) => {
    const parsedEnrollment = this.verifyData.verifyEnrollment(request.body);
    const enrollment = await this.enrollmentService.create(parsedEnrollment);
    return response.status(201).send(enrollment);
  };

  getEnrollment = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const enrollment = await this.enrollmentService.get(id);
    return response.status(200).send(enrollment);
  };

  getAllEnrollments = async (request: Request, response: Response) => {
    const enrollments = await this.enrollmentService.getAll();
    return response.status(200).send(enrollments);
  };

  updateEnrollment = async (request: Request, response: Response) => {
    const parsedEnrollment = this.verifyData.verifyEnrollment(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const enrollment = await this.enrollmentService.update(id, parsedEnrollment);
    return response.status(200).send(enrollment);
  };

  deleteEnrollment = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const enrollment = await this.enrollmentService.delete(id);
    return response.status(200).send(enrollment);
  };
}
