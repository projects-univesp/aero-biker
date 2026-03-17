import { Router } from "express";
import { studentRoutes } from "./studentRoutes";

export const appRouter = Router();
appRouter.use("/students", studentRoutes);
