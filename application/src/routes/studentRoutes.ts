import { StudentController } from "@controllers/studentController";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const student = new StudentController();

export const studentRoutes = Router()
  .post("/", tryCatch(student.createStudent))
  .get("/:id", tryCatch(student.getStudent))
  .patch("/", tryCatch(student.updateStudent))
  .delete("/", tryCatch(student.deleteStudent));
