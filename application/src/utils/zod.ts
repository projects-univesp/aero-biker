import { AdminDTO } from "@dtos/admin";
import { GroupDTO } from "@dtos/group";
import { PlanDTO } from "@dtos/plan";
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
      durationMonths: z.number().int().positive(),
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
        durationMonths: z.number().int().positive(),
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
      phone: z.string().min(10).max(15).optional(),
      email: z.email().max(100),
      password: z.string().min(6).max(72),
    });

    return schema.parse(admin);
  }

  verifyAdminPartial(admin: AdminDTO) {
    const schema = z
      .object({
        name: z.string().max(50),
        phone: z.string().min(10).max(15),
        email: z.email().max(100),
        password: z.string().min(6).max(72),
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
      email: z.email().max(100),
      password: z.string().min(1).max(72),
    });

    return schema.parse(user);
  }

  verifyEmail(email: string) {
    const schema = z.object({
      email: z.email().max(100),
    });

    return schema.parse({ email });
  }

  verifyResetPassword(data: { code: string; email: string; password: string }) {
    const schema = z.object({
      code: z.string().max(6),
      email: z.email().max(100),
      password: z.string().min(6).max(72),
    });

    return schema.parse(data);
  }

  verifySetup(data: {
    name: string;
    email: string;
    password: string;
    masterPassword: string;
    confirmMasterPassword: string;
  }) {
    const masterPasswordSchema = z
      .string()
      .min(12, "Mínimo 12 caracteres")
      .max(72)
      .regex(/[A-Z]/, "Deve conter letra maiúscula")
      .regex(/[a-z]/, "Deve conter letra minúscula")
      .regex(/[0-9]/, "Deve conter número")
      .regex(/[^A-Za-z0-9]/, "Deve conter caractere especial");

    const schema = z
      .object({
        name: z.string().min(2).max(50),
        email: z.email().max(100),
        password: z.string().min(8).max(72),
        masterPassword: masterPasswordSchema,
        confirmMasterPassword: z.string(),
      })
      .refine((d) => d.masterPassword === d.confirmMasterPassword, {
        message: "Senhas mestres não coincidem",
        path: ["confirmMasterPassword"],
      });

    return schema.parse(data);
  }

  verifyRegister(data: {
    name: string;
    email: string;
    password: string;
    masterPassword: string;
  }) {
    const schema = z.object({
      name: z.string().min(2).max(50),
      email: z.email().max(100),
      password: z.string().min(8).max(72),
      masterPassword: z.string().min(1),
    });

    return schema.parse(data);
  }

  verifyResetWithMaster(data: {
    email: string;
    masterPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) {
    const schema = z
      .object({
        email: z.email().max(100),
        masterPassword: z.string().min(1),
        newPassword: z.string().min(8).max(72),
        confirmNewPassword: z.string(),
      })
      .refine((d) => d.newPassword === d.confirmNewPassword, {
        message: "Senhas não coincidem",
        path: ["confirmNewPassword"],
      });

    return schema.parse(data);
  }

  verifyRecovery(data: {
    recoveryKey: string;
    newMasterPassword: string;
    confirmNewMasterPassword: string;
  }) {
    const masterPasswordSchema = z
      .string()
      .min(12, "Mínimo 12 caracteres")
      .max(72)
      .regex(/[A-Z]/, "Deve conter letra maiúscula")
      .regex(/[a-z]/, "Deve conter letra minúscula")
      .regex(/[0-9]/, "Deve conter número")
      .regex(/[^A-Za-z0-9]/, "Deve conter caractere especial");

    const schema = z
      .object({
        recoveryKey: z.string().min(1),
        newMasterPassword: masterPasswordSchema,
        confirmNewMasterPassword: z.string(),
      })
      .refine((d) => d.newMasterPassword === d.confirmNewMasterPassword, {
        message: "Senhas não coincidem",
        path: ["confirmNewMasterPassword"],
      });

    return schema.parse(data);
  }
}
