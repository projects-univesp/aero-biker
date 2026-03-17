import { Student } from "@models/student"
import { logger } from "@utils/logger"
import { responseFormat } from "@utils/responseFormat";

export class StudentServices {
    create = async (studentData: {name: string, phone: number}) => {
        const existingStudent = await Student.count({
            where: {phone: studentData.phone}
        })

        if (existingStudent > 0) throw logger.error("Student Already exists", 500);
        const createStudent = await Student.create(studentData)
        
        return responseFormat({
            message: "Student Created",
            statusCode: 201,
            data: createStudent
        })
    }

}