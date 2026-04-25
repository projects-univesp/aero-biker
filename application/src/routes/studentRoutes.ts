import { StudentController } from "@controllers/studentController";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";
import { renderPage } from "@middlewares/renderPage";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const student = new StudentController();

export const apiStudentRoutes = Router()
  .use(auth)
  .post("/", tryCatch(student.createStudent))
  .get("/", tryCatch(student.getAllStudents))
  .get("/:id", tryCatch(student.getStudent))
  .patch("/:id", tryCatch(student.updateStudent))
  .delete("/:id", tryCatch(student.deleteStudent));

export const studentRoutes = Router()
  .get("/", renderApi("/api/students", "pages/students/index", "students"))

