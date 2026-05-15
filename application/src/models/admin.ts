import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Admin extends Model {
  declare id: UUID;
  declare code: string | null;
  declare expiresAt: Date | null;
  declare isActive: boolean;
  declare name: string;
  declare phone: string;
  declare email: string;
  declare password: string;
}

Admin.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: true,
      defaultValue: null
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
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
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Admin",
  },
);
