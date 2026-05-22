import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Admin extends Model {
  declare id: UUID;
  declare isActive: boolean;
  declare name: string;
  declare phone: string | null;
  declare email: string;
  declare password: string;
  declare role: "OWNER" | "ADMIN" | "USER";
}

Admin.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("OWNER", "ADMIN", "USER"),
      allowNull: false,
      defaultValue: "USER",
    },
  },
  {
    sequelize,
    tableName: "Admin",
  },
);
