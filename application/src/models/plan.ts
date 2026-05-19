import { sequelize } from "@config/database";
import { PLANS } from "@dtos/plan";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Plan extends Model {
  declare id: UUID;
  declare name: string;
  declare description: string;
  declare price: number;
  declare durationMonths: PLANS;
  declare isActive: boolean;
}

Plan.init(
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
    description: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    durationMonths: {
      type: DataTypes.ENUM(PLANS.MONTHLY, PLANS.QUATERLY, PLANS.SEMESTER, PLANS.YEARLY),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Plans",
  }
);