import { GroupController } from "@controllers/groupController";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const group = new GroupController();

// API ROUTES
export const apiGroupRoutes = Router()
  .use(auth)
  .post("/", tryCatch(group.createGroup))
  .get("/", tryCatch(group.getAllGroups))
  .get("/:id", tryCatch(group.getGroup))
  .patch("/:id", tryCatch(group.updateGroup))
  .delete("/:id", tryCatch(group.deleteGroup));
