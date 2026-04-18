import { AuthController } from "@controllers/authController";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const auth = new AuthController()

export const apiAuthRoutes = Router()
.post('/', tryCatch(auth.authLogin))