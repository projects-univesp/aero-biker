import { AdminDTO } from "@dtos/admin";
import { GroupDTO } from "@dtos/group";
import { PlanDTO, PLANS } from "@dtos/plan";
import { ScheduleDTO } from "@dtos/schedule";
import { StudentDTO } from "@dtos/student";
import { SubscriptionDTO } from "@dtos/subscription";
import { z } from "zod";

export class VerifyData {
  verifyStudent(student: StudentDTO) {
    const schema = z.object({
      name: z.string().max(50),
      phone: z.string().min(10).max(15),
      isActive: z.boolean(),
      enrollment: z.enum(["ACTIVE", "INACTIVE"]),
      groupId: z.uuidv4(),
    });
    return schema.parse(student);
  }

  verifyStudentPartial(student: StudentDTO) {
    const schema = z
      .object({
        name: z.string().max(50),
        phone: z.string().min(10).max(15),
        isActive: z.boolean(),
        enrollment: z.enum(["ACTIVE", "INACTIVE"]),
        groupId: z.uuidv4(),
      })
      .partial();
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

  verifyGroupPartial(group: GroupDTO) {
    const schema = z
      .object({
        name: z.string().min(3).max(50),
        maxCapacity: z.number().int().positive(),
        daysOfWeek: z.string().min(3).max(50),
        time: z.string().min(3).max(20),
        isActive: z.boolean(),
      })
      .partial();

    return schema.parse(group);
  }

  verifySchedule(schedule: ScheduleDTO) {
    const schema = z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z
        .string()
        .regex(
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "Invalid start time format (HH:MM)",
        ),
      endTime: z
        .string()
        .regex(
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "Invalid end time format (HH:MM)",
        ),
      groupId: z.string().uuid(),
    });
    return schema.parse(schedule);
  }

  verifySchedulePartial(schedule: Partial<ScheduleDTO>) {
    const schema = z
      .object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z
          .string()
          .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Invalid start time format (HH:MM)",
          ),
        endTime: z
          .string()
          .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Invalid end time format (HH:MM)",
          ),
        groupId: z.string().uuid(),
      })
      .partial();
    return schema.parse(schedule);
  }

  verifyPlan(plan: PlanDTO) {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().positive(),
      durationMonths: z.enum(PLANS),
      isActive: z.boolean(),
    });

    return schema.parse(plan);
  }

  verifyPlanPartial(plan: PlanDTO) {
    const schema = z
      .object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().positive(),
        durationMonths: z.enum(PLANS),
        isActive: z.boolean(),
      })
      .partial();

    return schema.parse(plan);
  }

  verifySubscription(subscription: SubscriptionDTO) {
    const schema = z.object({
      studentId: z.uuid(),
      planId: z.uuid(),
      subscriptionValue: z.number().positive(),
      startDate: z.coerce.date(),
      renovationDate: z.coerce.date(),
      status: z.enum(["ACTIVE", "INACTIVE", "CANCELLED"]),
      paymentMethod: z.string().min(1),
    });

    return schema.parse(subscription);
  }

  verifySubscriptionPartial(subscription: SubscriptionDTO) {
    const schema = z
      .object({
        studentId: z.uuid(),
        planId: z.uuid(),
        subscriptionValue: z.number().positive(),
        startDate: z.coerce.date(),
        renovationDate: z.coerce.date(),
        status: z.enum(["ACTIVE", "INACTIVE", "CANCELLED"]),
        paymentMethod: z.string().min(1),
      })
      .partial();

    return schema.parse(subscription);
  }

  verifyAdmin(admin: AdminDTO) {
    const schema = z.object({
      name: z.string().max(50),
      phone: z.string().min(10).max(15),
      email: z.email().max(50),
      password: z.string().min(6).max(25),
    });

    return schema.parse(admin);
  }

  verifyAdminPartial(admin: AdminDTO) {
    const schema = z
      .object({
        name: z.string().max(50),
        phone: z.string().min(10).max(15),
        email: z.email().max(50),
        password: z.string().min(6).max(25),
      })
      .partial();

    return schema.parse(admin);
  }

  verifyId(id: string | string[]) {
    const schema = z.object({
      id: z.uuid(),
    });

    return schema.parse({ id });
  }

  verifyAuthRequest(user: { email: string; password: string }) {
    const schema = z.object({
      email: z.email().max(50),
      password: z.string().min(6).max(25),
    });

    return schema.parse(user);
  }

  verifyEmail(email: string) {
    const schema = z.object({
      email: z.email().max(50),
    });

    return schema.parse({ email });
  }

  verifyResetPassword(data: { code: string; email: string; password: string }) {
    const schema = z.object({
      code: z.string().max(6),
      email: z.email().max(50),
      password: z.string().min(6).max(25),
    });

    return schema.parse(data);
  }
}
