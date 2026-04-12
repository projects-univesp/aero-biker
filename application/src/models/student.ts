import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";
import { Group } from "./group";

export class Student extends Model {
  declare id: UUID;
  declare name: string;
  declare phone: string;
  declare isActive: boolean;
  declare enrollment: string;
  declare groupId: UUID;
}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    enrollment: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    groupId: {
      type: DataTypes.UUID,
      references: {
        model: "Groups",
        key: "id",
      },
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Students",
  },
);
