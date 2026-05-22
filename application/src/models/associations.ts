import { Student } from "./student";
import { Group } from "./group";
import { Subscription } from "./subscription";
import { Plan } from "./plan";
import { PlanModality } from "./planModality";
import { Schedule } from "./schedules";

// ==========================================
// Associações: Student <-> Group
// ==========================================
Student.belongsTo(Group, {
  foreignKey: "groupId",
  as: "group",
});

Group.hasMany(Student, {
  foreignKey: "groupId",
  as: "students",
});

// ==========================================
// Associações: Group <-> Schedule
// ==========================================
Group.hasMany(Schedule, { 
  foreignKey: "groupId", 
  as: "schedules" 
});

Schedule.belongsTo(Group, { 
  foreignKey: "groupId", 
  as: "group" 
});

// ==========================================
// Associações: Plan <-> PlanModality
// ==========================================
Plan.hasMany(PlanModality, { 
  foreignKey: "planId", 
  as: "prices" 
});

PlanModality.belongsTo(Plan, { 
  foreignKey: "planId", 
  as: "plan" 
});

// ==========================================
// Associações: Subscription (Assinatura)
// ==========================================
Subscription.belongsTo(Student, { 
  foreignKey: "studentId", 
  as: "student" 
});

Student.hasMany(Subscription, { 
  foreignKey: "studentId", 
  as: "subscriptions" 
});

Subscription.belongsTo(PlanModality, { 
  foreignKey: "planModalityId", 
  as: "planModality" 
});

PlanModality.hasMany(Subscription, { 
  foreignKey: "planModalityId", 
  as: "subscriptions" 
});