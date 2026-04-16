import { Router } from "express";
import { EnrollmentController } from "@controllers/enrollmentController";
import { tryCatch } from "@middlewares/tryCatch";

const enrollment = new EnrollmentController();

export const apiEnrollmentRoutes = Router()
  .post("/", tryCatch(enrollment.createEnrollment))
  .get("/", tryCatch(enrollment.getAllEnrollments))
  .get("/:id", tryCatch(enrollment.getEnrollment))
  .patch("/:id", tryCatch(enrollment.updateEnrollment))
  .delete("/:id", tryCatch(enrollment.deleteEnrollment));
