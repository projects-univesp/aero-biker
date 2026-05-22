import { AdminDTO } from "@dtos/admin";
import { GroupDTO } from "@dtos/group";
import { PlanDTO } from "@dtos/plan";
import { ScheduleDTO } from "@dtos/schedule";
import { StudentDTO } from "@dtos/student";
import { SubscriptionDTO } from "@dtos/subscription";
import { z } from "zod";

export class VerifyData {
  verifyStudent(student: StudentDTO) {
    return z.object({
      name: z.string().max(50),
      phone: z.string().min(10).max(15),
      isActive: z.boolean(),
      enrollment: z.enum(["ACTIVE", "INACTIVE"]),
      groupId: z.uuidv4(),
    }).parse(student);
  }

  verifyStudentPartial(student: StudentDTO) {
    return z.object({
      name: z.string().max(50),
      phone: z.string().min(10).max(15),
      isActive: z.boolean(),
      enrollment: z.enum(["ACTIVE", "INACTIVE"]),
      groupId: z.uuidv4(),
    }).partial().parse(student);
  }

  verifyGroup(group: GroupDTO) {
    return z.object({
      name: z.string().min(3).max(50),
      maxCapacity: z.number().int().positive(),
      daysOfWeek: z.string().min(3).max(50),
      time: z.string().min(3).max(20),
      isActive: z.boolean(),
    }).parse(group);
  }

  verifyGroupPartial(group: GroupDTO) {
    return z.object({
      name: z.string().min(3).max(50),
      maxCapacity: z.number().int().positive(),
      daysOfWeek: z.string().min(3).max(50),
      time: z.string().min(3).max(20),
      isActive: z.boolean(),
    }).partial().parse(group);
  }

  verifySchedule(schedule: ScheduleDTO) {
    return z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)"),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)"),
      groupId: z.string().uuid(),
    }).parse(schedule);
  }

  verifySchedulePartial(schedule: Partial<ScheduleDTO>) {
    return z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)"),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)"),
      groupId: z.string().uuid(),
    }).partial().parse(schedule);
  }

  verifyPlan(plan: PlanDTO) {
    return z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().positive(),
      durationMonths: z.number().int().positive(),
      isActive: z.boolean(),
    }).parse(plan);
  }

  verifyPlanPartial(plan: PlanDTO) {
    return z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().positive(),
      durationMonths: z.number().int().positive(),
      isActive: z.boolean(),
    }).partial().parse(plan);
  }

  verifySubscription(subscription: SubscriptionDTO) {
    return z.object({
      studentId: z.uuid(),
      planId: z.uuid(),
      subscriptionValue: z.number().positive(),
      startDate: z.coerce.date(),
      renovationDate: z.coerce.date(),
      status: z.enum(["ACTIVE", "INACTIVE", "CANCELLED"]),
      paymentMethod: z.string().min(1),
    }).parse(subscription);
  }

  verifySubscriptionPartial(subscription: SubscriptionDTO) {
    return z.object({
      studentId: z.uuid(),
      planId: z.uuid(),
      subscriptionValue: z.number().positive(),
      startDate: z.coerce.date(),
      renovationDate: z.coerce.date(),
      status: z.enum(["ACTIVE", "INACTIVE", "CANCELLED"]),
      paymentMethod: z.string().min(1),
    }).partial().parse(subscription);
  }

  verifyAdmin(admin: AdminDTO) {
    return z.object({
      name: z.string().max(50),
      phone: z.string().min(10).max(15).optional(),
      email: z.email().max(100),
      password: z.string().min(6).max(72),
    }).parse(admin);
  }

  verifyAdminPartial(admin: AdminDTO) {
    return z.object({
      name: z.string().max(50),
      phone: z.string().min(10).max(15),
      email: z.email().max(100),
      password: z.string().min(6).max(72),
    }).partial().parse(admin);
  }

  verifyId(id: string | string[]) {
    return z.object({ id: z.uuid() }).parse({ id });
  }

  verifyAuthRequest(user: { email: string; password: string }) {
    return z.object({
      email: z.email().max(100),
      password: z.string().min(1).max(72),
    }).parse(user);
  }

  verifyEmail(body: { email: string }) {
    return z.object({ email: z.email().max(100) }).parse(body);
  }

  verifySetup(data: { academyName: string; name: string; email: string; password: string }) {
    return z.object({
      academyName: z.string().min(2).max(100),
      name: z.string().min(2).max(50),
      email: z.email().max(100),
      password: z.string().min(8).max(72),
    }).parse(data);
  }

  verifyResetPassword(data: { token: string; password: string }) {
    return z.object({
      token: z.string().length(64),
      password: z.string().min(8).max(72),
    }).parse(data);
  }

  verifyAcademy(data: { name?: string; cnpj?: string; phone?: string; address?: string }) {
    return z.object({
      name: z.string().min(2).max(100),
      cnpj: z.string().max(18).optional(),
      phone: z.string().min(10).max(25).optional(),
      address: z.string().max(200).optional(),
    }).partial().parse(data);
  }

  verifyCreateAdmin(data: { name: string; email: string; password: string; role?: string }) {
    return z.object({
      name: z.string().min(2).max(50),
      email: z.email().max(100),
      password: z.string().min(8).max(72),
      role: z.enum(["ADMIN", "USER"]).default("USER"),
    }).parse(data);
  }

  verifyChangePassword(data: { currentPassword: string; newPassword: string }) {
    return z.object({
      currentPassword: z.string().min(1).max(72),
      newPassword: z.string().min(8).max(72),
    }).parse(data);
  }
}
