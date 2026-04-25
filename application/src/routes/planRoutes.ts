import { Router } from "express";
import { PlanController } from "@controllers/planController";
import { tryCatch } from "@middlewares/tryCatch";
import { auth } from "@middlewares/auth";

const plan = new PlanController();

export const apiPlanRoutes = Router()
  .use(auth)
  .post("/", tryCatch(plan.createPlan))
  .get("/", tryCatch(plan.getAllPlans))
  .get("/:id", tryCatch(plan.getPlan))
  .patch("/:id", tryCatch(plan.updatePlan))
  .delete("/:id", tryCatch(plan.deletePlan));
