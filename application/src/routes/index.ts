import { Router } from "express";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiGroupRoutes } from "./groupRoutes";


export const appRouter = Router();

// API
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);

// FRONT
appRouter.use("/students", studentRoutes);
