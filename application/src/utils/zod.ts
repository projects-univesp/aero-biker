import { string, z } from "zod";

export class VerifyData {
    verifyStudent(student: {name: string, phone: number}) {
        const schema = z.object({
            name: z.string().max(50),
            phone: z.number().max(12),
        });
        
        return schema.parse(student);
    }
}