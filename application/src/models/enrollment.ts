import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Enrollment extends Model {
  declare id: UUID;
  declare studentId: UUID;
  declare groupId: UUID;
  declare status: string;
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
      references: {
        model: "Students",
        key: "id",
      },
      allowNull: false,
    },
    groupId: {
      type: DataTypes.UUID,
      references: {
        model: "Groups",
        key: "id",
      },
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Enrollments",
  }
);
