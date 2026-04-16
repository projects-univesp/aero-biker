import { Student } from "./student";
import { Group } from "./group";
import { Subscription } from "./subscription";
import { Plan } from "./plan";
import { Enrollment } from "./enrollment";

Student.belongsTo(Group, {
  foreignKey: "groupId",
  as: "group",
});

Group.hasMany(Student, {
  foreignKey: "groupId",
  as: "students",
});

Subscription.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Subscription.belongsTo(Plan, { foreignKey: "planId", as: "plan" });
Student.hasMany(Subscription, { foreignKey: "studentId", as: "subscriptions" });
Plan.hasMany(Subscription, { foreignKey: "planId", as: "subscriptions" });

Enrollment.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Enrollment.belongsTo(Group, { foreignKey: "groupId", as: "group" });
Student.hasMany(Enrollment, { foreignKey: "studentId", as: "enrollments" });
Group.hasMany(Enrollment, { foreignKey: "groupId", as: "enrollments" });
