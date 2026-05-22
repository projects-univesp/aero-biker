import { Admin } from "./admin";
import { Group } from "./group";
import { Plan } from "./plan";
import { PlanModality } from "./planModality";
import { Schedule } from "./schedules";
import { Student } from "./student";
import { Subscription } from "./subscription";
import { PasswordReset } from "./passwordReset";
import "./academy";

// Student <-> Group
Student.belongsTo(Group, { foreignKey: "groupId", as: "group" });
Group.hasMany(Student, { foreignKey: "groupId", as: "students" });

// Group <-> Schedule
Group.hasMany(Schedule, { foreignKey: "groupId", as: "schedules" });
Schedule.belongsTo(Group, { foreignKey: "groupId", as: "group" });

// Plan <-> PlanModality
Plan.hasMany(PlanModality, { foreignKey: "planId", as: "prices" });
PlanModality.belongsTo(Plan, { foreignKey: "planId", as: "plan" });

// Subscription <-> Student / Plan / PlanModality
Subscription.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Student.hasMany(Subscription, { foreignKey: "studentId", as: "subscriptions" });
Subscription.belongsTo(Plan, { foreignKey: "planId", as: "plan" });
Plan.hasMany(Subscription, { foreignKey: "planId", as: "subscriptions" });
Subscription.belongsTo(PlanModality, { foreignKey: "planModalityId", as: "planModality" });
PlanModality.hasMany(Subscription, { foreignKey: "planModalityId", as: "subscriptions" });

// Admin <-> PasswordReset
Admin.hasMany(PasswordReset, { foreignKey: "adminId", as: "passwordResets" });
PasswordReset.belongsTo(Admin, { foreignKey: "adminId", as: "admin" });
