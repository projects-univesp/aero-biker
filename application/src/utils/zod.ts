import { z } from "zod";

export class VerifyData {
  verifyId(id: string | string[]) {
    const schema = z.object({
      id: z.string().uuid("Invalid UUID"),
    });

    return schema.parse({ id });
  }

  verifyStudent(student: {
    name: string;
    phone: string;
    isActive: boolean;
  }) {
    const schema = z.object({
      name: z.string().max(50),
      phone: z.string().min(10).max(15),
      isActive: z.boolean(),
    });

    return schema.parse(student);
  }

  verifyGroup(group: {
    name: string;
    description?: string;
  }) {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    });

    return schema.parse(group);
  }

  verifyPlan(plan: {
    name: string;
    description: string;
    price: number;
    durationMonths: number;
  }) {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().positive(),
      durationMonths: z.number().int().positive(),
    });

    return schema.parse(plan);
  }

  verifyUpdatePlan(
    plan: Partial<{
      name: string;
      description: string;
      price: number;
      durationMonths: number;
    }>
  ) {
    const schema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      price: z.number().positive().optional(),
      durationMonths: z.number().int().positive().optional(),
    });

    return schema.parse(plan);
  }
}