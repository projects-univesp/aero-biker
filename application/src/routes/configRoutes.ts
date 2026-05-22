import { ConfigController } from "@controllers/configController";
import { auth } from "@middlewares/auth";
import { requireRole } from "@middlewares/requireAuth";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const config = new ConfigController();

// API routes (JSON)
export const apiConfigRoutes = Router()
  .use(auth)
  .get("/academy", tryCatch(config.getAcademy))
  .patch("/academy", requireRole("OWNER", "ADMIN"), tryCatch(config.updateAcademy))
  .get("/users", requireRole("OWNER", "ADMIN"), tryCatch(config.listAdmins))
  .post("/users", requireRole("OWNER", "ADMIN"), tryCatch(config.createAdmin))
  .patch("/users/:id/deactivate", requireRole("OWNER", "ADMIN"), tryCatch(config.deactivateAdmin))
  .patch("/users/:id/reactivate", requireRole("OWNER", "ADMIN"), tryCatch(config.reactivateAdmin))
  .post("/change-password", tryCatch(config.changePassword));
