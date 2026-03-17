import { string, z } from "zod";

export class VerifyData {
    verifyStudent(student: {name: string, phone: string, isActive: boolean}) {
        const schema = z.object({
            name: z.string().max(50),
            phone: z.string().min(10).max(15),
            isActive: z.boolean()
        });
        
        return schema.parse(student);
    }
}