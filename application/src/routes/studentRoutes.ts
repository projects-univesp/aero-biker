import { StudentController } from "@controllers/studentController";
import { renderApi } from "@middlewares/renderApi";
import { renderPage } from "@middlewares/renderPage";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const student = new StudentController();

export const apiStudentRoutes = Router()
  .post("/", tryCatch(student.createStudent))
  .get("/", tryCatch(student.getAllStudents))
  .get("/:id", tryCatch(student.getStudent))
  .patch("/:id", tryCatch(student.updateStudent))
  .delete("/:id", tryCatch(student.deleteStudent));

export const studentRoutes = Router()
  .get("/create", renderPage("students/create"))
  .get("/", renderApi("/api/students", "pages/students/index", "students"))
  
  .get(
    "/:id",
    renderApi(
      (req) => `/api/students/${req.params.id}`,
      "pages/students/profile",
      "student",
    ),
  )

  .get(
    "/:id/edit",
    renderApi(
      (req) => `/api/students/${req.params.id}`,
      "pages/students/edit",
      "student",
    ),
  );
