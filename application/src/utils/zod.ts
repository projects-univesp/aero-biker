import { GroupDTO } from "@dtos/group";
import { PlanDTO } from "@dtos/plan";
import { StudentDTO } from "@dtos/student";
import { string, z } from "zod";

export class VerifyData {
  verifyStudent(student: StudentDTO) {
    const schema = z.object({
      name: z.string().max(50),
      phone: z.string().min(10).max(15),
      isActive: z.boolean(),
      enrollment: z.enum(["ACTIVE", "INACTIVE"]),
      groupId: z.uuidv4()
    });

    return schema.parse(student);
  }

  verifyGroup(group: GroupDTO) {
    const schema = z.object({
      name: z.string().min(3).max(50),
      maxCapacity: z.number().int().positive(),
      daysOfWeek: z.string().min(3).max(50),
      time: z.string().min(3).max(20),
      isActive: z.boolean(),
    });

    return schema.parse(group);
  }
  
  verifyPlan(plan: PlanDTO) {
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().positive(),
        durationMonths: z.number().int().positive(),
        isActive: z.boolean(),
      });
  
      return schema.parse(plan);
    }

  verifyId(id: string | string[]) {
    const schema = z.object({
      id: z.uuid(),
    });

    return schema.parse({ id });
  }
}
