import { sequelize } from "@config/database";
import { DataTypes, Model } from "sequelize";

export class SystemConfig extends Model {
  declare key: string;
  declare value: string;
}

SystemConfig.init(
  {
    key: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "SystemConfig",
    timestamps: false,
  },
);
