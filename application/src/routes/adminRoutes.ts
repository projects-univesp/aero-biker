import { AdminController } from "@controllers/adminController";
import { renderApi } from "@middlewares/renderApi";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const admin = new AdminController();

// API ROUTES
export const apiAdminRoutes = Router()
  .post("/", tryCatch(admin.createAdmin))
  .post("/", tryCatch(admin.forgotPassword))
  .get("/:id", tryCatch(admin.getAdmin))
  .patch("/:id", tryCatch(admin.updateAdmin))
  .delete("/:id", tryCatch(admin.deleteAdmin));

