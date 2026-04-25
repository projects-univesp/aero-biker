import { Router } from "express";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiGroupRoutes } from "./groupRoutes";
import { apiPlanRoutes } from "./planRoutes";
import { apiSubscriptionRoutes } from "./subscriptionRoutes";
import { apiAdminRoutes } from "./adminRoutes";
import { apiAuthRoutes } from "./authRoutes";

export const appRouter = Router();

// API
appRouter.use("/api/admin", apiAdminRoutes);
appRouter.use("/api/auth", apiAuthRoutes);
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);
appRouter.use("/api/plans", apiPlanRoutes);
appRouter.use("/api/subscriptions", apiSubscriptionRoutes);

// FRONT
appRouter.use("/students", studentRoutes);
