import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  durationMonths: z.number().int().positive(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const idSchema = z.object({
  id: z.string().uuid(),
});