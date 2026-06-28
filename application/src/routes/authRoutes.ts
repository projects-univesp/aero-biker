import { AuthController } from "@controllers/authController";
import { rateLimitAuth } from "@middlewares/rateLimit";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const auth = new AuthController();

export const apiAuthRoutes = Router()
  .post("/setup", rateLimitAuth, tryCatch(auth.setup))
  .post("/login", rateLimitAuth, tryCatch(auth.login))
  .post("/forgot-password", rateLimitAuth, tryCatch(auth.forgotPassword))
  .post("/reset-password", rateLimitAuth, tryCatch(auth.resetPassword))
  .post("/logout", tryCatch(auth.logout));
