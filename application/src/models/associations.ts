import { Student } from "./student";
import { Group } from "./group";
import { Subscription } from "./subscription";
import { Plan } from "./plan";
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

// Subscription <-> Student / Plan
Subscription.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Student.hasMany(Subscription, { foreignKey: "studentId", as: "subscriptions" });
Subscription.belongsTo(Plan, { foreignKey: "planId", as: "plan" });
Plan.hasMany(Subscription, { foreignKey: "planId", as: "subscriptions" });

// Admin <-> PasswordReset
Admin.hasMany(PasswordReset, { foreignKey: "adminId", as: "passwordResets" });
PasswordReset.belongsTo(Admin, { foreignKey: "adminId", as: "admin" });
