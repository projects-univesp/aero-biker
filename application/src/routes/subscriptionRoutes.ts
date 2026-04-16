import { Router } from "express";
import { SubscriptionController } from "@controllers/subscriptionController";
import { tryCatch } from "@middlewares/tryCatch";

const subscription = new SubscriptionController();

export const apiSubscriptionRoutes = Router()
  .post("/", tryCatch(subscription.createSubscription))
  .get("/", tryCatch(subscription.getAllSubscriptions))
  .get("/:id", tryCatch(subscription.getSubscription))
  .patch("/:id", tryCatch(subscription.updateSubscription))
  .delete("/:id", tryCatch(subscription.deleteSubscription));
