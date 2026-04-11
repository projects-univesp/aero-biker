import { Router } from "express";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiGroupRoutes } from "./groupRoutes";
import { apiPlanRoutes } from "./planRoutes";

export const appRouter = Router();

// API
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);
appRouter.use("/api/plans", apiPlanRoutes);

// FRONT
appRouter.use("/students", studentRoutes);