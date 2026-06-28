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

    return response.status(201).send({
      message: "Student created succesfully",
      data: student,
    });
  };

  getStudent = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const student = await this.studentServices.get(id);

    return response.status(200).send({
      message: "Student found successfully",
      data: student,
    });
  };

  getAllStudents = async (request: Request, response: Response) => {
    const students = await this.studentServices.getAll();

    return response.status(200).send({
      message: "Students found successfully",
      data: students,
    });
  };

  updateStudent = async (request: Request, response: Response) => {
    const parsedStudent = this.verifyData.verifyStudentPartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const student = await this.studentServices.update(id, parsedStudent);

    return response.status(200).send({
      message: "Student updated succesfully",
      data: student,
    });
  };

  deleteStudent = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    await this.studentServices.delete(id);

    return response
      .status(200)
      .send({ message: "Student deactivated succesfully" });
  };
}
