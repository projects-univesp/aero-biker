import { Router } from "express";
import { PlanController } from "@controllers/planController";
import { tryCatch } from "@middlewares/tryCatch";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";

const plan = new PlanController();

export const apiPlanRoutes = Router()
  .use(auth)
  .post("/", tryCatch(plan.createPlan))
  .get("/", tryCatch(plan.getAllPlans))
  .get("/:id", tryCatch(plan.getPlan))
  .patch("/:id", tryCatch(plan.updatePlan))
  .delete("/:id", tryCatch(plan.deletePlan));

export const planRoutes = Router()
  .get("/", renderApi("/api/plans", "pages/plans/index", "plans"));
