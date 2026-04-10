import { Router } from "express";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiGroupRoutes } from "./groupRoutes";

export const appRouter = Router();

appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);

appRouter.use("/students", studentRoutes);
