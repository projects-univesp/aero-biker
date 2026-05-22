import { Router } from "express";
import { DashboardController } from "@controllers/dashboardController";
import { tryCatch } from "@middlewares/tryCatch";
import { renderApi } from "@middlewares/renderApi";

const dashboard = new DashboardController();

export const apiDashboardRoutes = Router()
  //.use(auth)
  .get("/", tryCatch(dashboard.getDashboard));

export const dashboardRoutes = Router()
  .get(
    "/",
    renderApi("/api/dashboard", "pages/dashboard/index", "dashboard", {
      emptyMessage: "Nenhuma informação encontrada para o dashboard.",
      category: "Dashboard.",
    })
  )