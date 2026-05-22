import { renderApi } from "@middlewares/renderApi";
import { requireRole } from "@middlewares/requireAuth";
import { Router } from "express";

export const configPageRoutes = Router()
  .get(
    "/",
    renderApi("/api/config/academy", "pages/config/index", "academy"),
  )
  .get(
    "/users",
    requireRole("OWNER", "ADMIN"),
    renderApi("/api/config/users", "pages/config/users", "users"),
  );
