import { AuthController } from "@controllers/authController";
import { rateLimitAuth, rateLimitRecovery } from "@middlewares/rateLimit";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const auth = new AuthController();

export const apiAuthRoutes = Router()
  .get("/setup-status", tryCatch(auth.getSetupStatus))
  .post("/login", rateLimitAuth, tryCatch(auth.emailLogin))
  .post("/", rateLimitAuth, tryCatch(auth.emailLogin))
  .post("/setup", rateLimitAuth, tryCatch(auth.setup))
  .post("/register", rateLimitAuth, tryCatch(auth.register))
  .post(
    "/reset-password",
    rateLimitAuth,
    tryCatch(auth.resetPasswordWithMaster),
  )
  .post("/recovery", rateLimitRecovery, tryCatch(auth.resetMasterPassword))
  .post("/logout", tryCatch(auth.logout));
