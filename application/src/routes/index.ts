import { Router } from "express";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiGroupRoutes } from "./groupRoutes";
import { apiEnrollmentRoutes } from "./enrollmentRoutes";

export const appRouter = Router();

// API
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);
appRouter.use("/api/enrollment", apiEnrollmentRoutes);

// FRONT
appRouter.use("/students", studentRoutes);
