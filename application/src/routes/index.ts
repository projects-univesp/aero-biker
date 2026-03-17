import { Router } from "express";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";

export const appRouter = Router();
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/students", studentRoutes);
