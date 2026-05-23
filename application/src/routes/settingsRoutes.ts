import { SettingsController } from "@controllers/settingsController";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const settings = new SettingsController();

export const apiSettingsRoutes = Router()
  .get("/plan-prices", tryCatch(settings.getPlanPrices))
  .put("/plan-prices", tryCatch(settings.savePlanPrices))
  .get("/credentials", tryCatch(settings.getCredentials))
  .put("/credentials", tryCatch(settings.saveCredentials));
