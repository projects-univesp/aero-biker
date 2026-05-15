import { AdminController } from "@controllers/adminController";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const admin = new AdminController();

// API ROUTES
export const apiAdminRoutes = Router()
  .post("/", tryCatch(admin.createAdmin))
  .post("/forgot-password", tryCatch(admin.forgotPassword))
  .post("/reset-password", tryCatch(admin.resetPassword))
  .get("/:id", auth, tryCatch(admin.getAdmin))
  .patch("/:id", auth, tryCatch(admin.updateAdmin))
  .delete("/:id", auth, tryCatch(admin.deleteAdmin));
