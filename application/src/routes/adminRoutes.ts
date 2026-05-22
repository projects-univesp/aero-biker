import { AdminController } from "@controllers/adminController";
import { auth } from "@middlewares/auth";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const admin = new AdminController();

export const apiAdminRoutes = Router()
  .use(auth)
  .get("/:id", tryCatch(admin.getAdmin))
  .patch("/:id", tryCatch(admin.updateAdmin))
  .delete("/:id", tryCatch(admin.deleteAdmin));
