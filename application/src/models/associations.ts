import { Student } from "./student";
import { Group } from "./group";

Student.belongsTo(Group, {
  foreignKey: "groupId",
  as: "group",
});

Group.hasMany(Student, {
  foreignKey: "groupId",
  as: "students",
});
