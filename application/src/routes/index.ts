import {
  requireAuth,
  requireSetupComplete,
  requireSetupIncomplete,
} from "@middlewares/requireAuth";
import { Router } from "express";
import { apiAuthRoutes } from "./authRoutes";
import { apiConfigRoutes } from "./configRoutes";
import { apiGroupRoutes, groupRoutes } from "./groupRoutes";
import { apiPlanRoutes, planRoutes } from "./planRoutes";
import { apiScheduleRoutes } from "./scheduleRoutes";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiSubscriptionRoutes, subscriptionRoutes } from "./subscriptionRoutes";
import { configPageRoutes } from "./configPageRoutes";

export const appRouter = Router();

// API
appRouter.use("/api/auth", apiAuthRoutes);
appRouter.use("/api/config", apiConfigRoutes);
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);
appRouter.use("/schedules", apiScheduleRoutes);
appRouter.use("/api/plans", apiPlanRoutes);
appRouter.use("/api/subscriptions", apiSubscriptionRoutes);

// AUTH PAGES (public)
appRouter.get("/setup", requireSetupIncomplete, (req, res) =>
  res.render("pages/auth/setup", { layout: "auth" }),
);
appRouter.get("/login", requireSetupComplete, (req, res) =>
  res.render("pages/auth/login", { layout: "auth" }),
);
appRouter.get("/forgot-password", requireSetupComplete, (req, res) =>
  res.render("pages/auth/forgot-password", { layout: "auth" }),
);
appRouter.get("/reset-password", requireSetupComplete, (req, res) => {
  const token = req.query.token as string | undefined;
  res.render("pages/auth/reset-password", { layout: "auth", token: token ?? "" });
});

// ROOT
appRouter.get("/", requireAuth, (req, res) => res.redirect("/students"));

// FRONT (protected)
appRouter.use("/students", requireAuth, studentRoutes);
appRouter.use("/groups", requireAuth, groupRoutes);
appRouter.use("/plans", requireAuth, planRoutes);
appRouter.use("/subscriptions", requireAuth, subscriptionRoutes);
appRouter.use("/config", requireAuth, configPageRoutes);
