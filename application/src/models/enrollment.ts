import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";
import { Student } from "@models/student";
import { Group } from "@models/group";

export class Enrollment extends Model {
  declare id: UUID;
  declare studentId: UUID;
  declare groupId: UUID;
  declare status: "active" | "cancelled";
}

Enrollment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    studentId: {
      type: DataTypes.UUID,
      references: { model: Student, key: "id" },
    },
    groupId: {
      type: DataTypes.UUID,
      references: { model: Group, key: "id" },
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "active",
    },
  },
  { sequelize, tableName: "Enrollments" },
);