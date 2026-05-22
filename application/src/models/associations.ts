import { Admin } from "./admin";
import { Group } from "./group";
import { Plan } from "./plan";
import { Schedule } from "./schedules";
import { Student } from "./student";
import { Subscription } from "./subscription";
import { PasswordReset } from "./passwordReset";
import "./academy";

Student.belongsTo(Group, { foreignKey: "groupId", as: "group" });
Group.hasMany(Student, { foreignKey: "groupId", as: "students" });

Subscription.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Subscription.belongsTo(Plan, { foreignKey: "planId", as: "plan" });
Student.hasMany(Subscription, { foreignKey: "studentId", as: "subscriptions" });
Plan.hasMany(Subscription, { foreignKey: "planId", as: "subscriptions" });

Group.hasMany(Schedule, { foreignKey: "groupId", as: "schedules" });
Schedule.belongsTo(Group, { foreignKey: "groupId", as: "group" });

Admin.hasMany(PasswordReset, { foreignKey: "adminId", as: "passwordResets" });
PasswordReset.belongsTo(Admin, { foreignKey: "adminId", as: "admin" });
