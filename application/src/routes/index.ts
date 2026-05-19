import { Router } from "express";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiGroupRoutes, groupRoutes } from "./groupRoutes";
import { apiPlanRoutes, planRoutes } from "./planRoutes";
import { apiSubscriptionRoutes, subscriptionRoutes } from "./subscriptionRoutes";
import { apiAdminRoutes } from "./adminRoutes";
import { apiAuthRoutes } from "./authRoutes";
import { apiScheduleRoutes } from "./scheduleRoutes";
import { apiDashboardRoutes, dashboardRoutes } from "./dashboardRoutes";

export const appRouter = Router();

// API
appRouter.use("/api/admin", apiAdminRoutes);
appRouter.use("/api/auth", apiAuthRoutes);
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);
appRouter.use("/schedules", apiScheduleRoutes);
appRouter.use("/api/plans", apiPlanRoutes);
appRouter.use("/api/subscriptions", apiSubscriptionRoutes);
appRouter.use("/api/dashboard", apiDashboardRoutes);

// FRONT
appRouter.use("/students", studentRoutes);
appRouter.use("/groups", groupRoutes);
appRouter.use("/plans", planRoutes);
appRouter.use("/subscriptions", subscriptionRoutes);
appRouter.use("/dashboard", dashboardRoutes);