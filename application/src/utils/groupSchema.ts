import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().min(3).max(50),
  maxCapacity: z.number().int().positive(),
  daysOfWeek: z.string().min(3),
  time: z.string().min(3),
  isActive: z.boolean(),
});

export type GroupDTO = z.infer<typeof groupSchema>;