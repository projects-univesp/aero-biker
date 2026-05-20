import {
  requireAuth,
  requireSetupComplete,
  requireSetupIncomplete,
} from "@middlewares/requireAuth";
import { Router } from "express";
import { apiAdminRoutes } from "./adminRoutes";
import { apiAuthRoutes } from "./authRoutes";
import { apiGroupRoutes, groupRoutes } from "./groupRoutes";
import { apiPlanRoutes, planRoutes } from "./planRoutes";
import { apiScheduleRoutes } from "./scheduleRoutes";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import {
  apiSubscriptionRoutes,
  subscriptionRoutes,
} from "./subscriptionRoutes";

export const appRouter = Router();

// API
appRouter.use("/api/admin", apiAdminRoutes);
appRouter.use("/api/auth", apiAuthRoutes);
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
appRouter.get("/register", requireSetupComplete, (req, res) =>
  res.render("pages/auth/register", { layout: "auth" }),
);
appRouter.get("/forgot-password", requireSetupComplete, (req, res) =>
  res.render("pages/auth/forgot-password", { layout: "auth" }),
);

// ROOT — redirect to appropriate page
appRouter.get("/", requireAuth, (req, res) => res.redirect("/students"));

// FRONT (protected with session auth)
appRouter.use("/students", requireAuth, studentRoutes);
appRouter.use("/groups", requireAuth, groupRoutes);
appRouter.use("/plans", requireAuth, planRoutes);
appRouter.use("/subscriptions", requireAuth, subscriptionRoutes);
