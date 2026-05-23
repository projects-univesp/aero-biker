import { ScheduleController } from "@controllers/scheduleController";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const schedule = new ScheduleController();

export const apiScheduleRoutes = Router()
  //.use(auth)
  .post("/", tryCatch(schedule.createSchedule))
  .get("/", tryCatch(schedule.getAllSchedules))
  .get("/:id", tryCatch(schedule.getSchedule))
  .patch("/:id", tryCatch(schedule.updateSchedule))
  .delete("/:id", tryCatch(schedule.deleteSchedule));

export const scheduleRoutes = Router().get(
  "/",
  renderApi("/api/schedules", "pages/schedules/index", "schedules", {
    emptyMessage: "Nenhuma agenda de aulas cadastrado até o momento.",
    category: "Schedules.",
  }),
);
