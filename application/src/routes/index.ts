import { Router } from "express";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiGroupRoutes } from "./groupRoutes";
import { apiPlanRoutes } from "./planRoutes";
import { apiSubscriptionRoutes } from "./subscriptionRoutes";
import { apiEnrollmentRoutes } from "./enrollmentRoutes";


export const appRouter = Router();

// API
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);
appRouter.use("/api/plans", apiPlanRoutes);
appRouter.use("/api/subscriptions", apiSubscriptionRoutes);
appRouter.use("/api/enrollments", apiEnrollmentRoutes);

// FRONT
appRouter.use("/students", studentRoutes);
