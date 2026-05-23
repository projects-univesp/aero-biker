import { DataTypes, Model } from "sequelize";
import { sequelize } from "@config/database";

export class Plan extends Model {
  declare id: string;
  declare name: string;
  declare description: string;
  declare price: number;
  declare durationMonths: string;
  declare isActive: boolean;
}

Plan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    durationMonths: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Plan",
    tableName: "plans",
    timestamps: true,
  }
);