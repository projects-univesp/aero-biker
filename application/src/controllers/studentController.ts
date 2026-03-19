import { StudentServices } from "@services/studentServices";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class StudentController {
  private readonly verifyData: VerifyData;
  private readonly studentServices: StudentServices;
  constructor() {
    this.verifyData = new VerifyData();
    this.studentServices = new StudentServices();
  }

  createStudent = async (request: Request, response: Response) => {
    const parsedStudent = this.verifyData.verifyStudent(request.body);
    const student = await this.studentServices.create(parsedStudent);
    return response.status(201).send(student);
  };

  getStudent = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const student = await this.studentServices.get(id);
    return response.status(200).send(student);
  };

  getAllStudents = async (request: Request, response: Response) => {
    const students = await this.studentServices.getAll();
    return response.status(200).send(students);
  };

  updateStudent = async (request: Request, response: Response) => {
    const parsedStudent = this.verifyData.verifyStudent(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const student = await this.studentServices.update(id, parsedStudent);
    return response.status(200).send(student);
  };

  deleteStudent = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const student = await this.studentServices.delete(id);
    return response.status(200).send(student);
  };
}
