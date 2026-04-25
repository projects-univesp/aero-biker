import { Router } from "express";
import { SubscriptionController } from "@controllers/subscriptionController";
import { tryCatch } from "@middlewares/tryCatch";
import { auth } from "@middlewares/auth";

const subscription = new SubscriptionController();

export const apiSubscriptionRoutes = Router()
  .use(auth)
  .post("/", tryCatch(subscription.createSubscription))
  .get("/", tryCatch(subscription.getAllSubscriptions))
  .get("/:id", tryCatch(subscription.getSubscription))
  .patch("/:id", tryCatch(subscription.updateSubscription))
  .delete("/:id", tryCatch(subscription.deleteSubscription));
