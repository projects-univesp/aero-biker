import { StudentServices } from "@services/studentServices";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class StudentController {
    private readonly verifyData: VerifyData
    private readonly studentServices: StudentServices
    constructor(){
        this.verifyData = new VerifyData()
        this.studentServices = new StudentServices()
    }

    createStudent = async(request: Request, response: Response) => {
        const parsedStudent = this.verifyData.verifyStudent(request.body)
        const student = await this.studentServices.create(parsedStudent)
        return response.status(201).send(student)
    }
}