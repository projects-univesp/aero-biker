import { GroupController } from "@controllers/groupController";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const group = new GroupController();

// API ROUTES
export const apiGroupRoutes = Router()
  .post("/", tryCatch(group.createGroup))
  .get("/", tryCatch(group.getAllGroups))
  .get("/:id", tryCatch(group.getGroup))
  .patch("/:id", tryCatch(group.updateGroup))
  .delete("/:id", tryCatch(group.deleteGroup));
