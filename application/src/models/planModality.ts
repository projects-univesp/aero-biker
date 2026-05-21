import { sequelize } from "@config/database";
import { PLANS } from "@dtos/plan";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class PlanModality extends Model {
  declare id: UUID;
  declare planId: UUID;
  declare price: number;
  declare durationMonths: PLANS;
  declare isActive: boolean;
}

PlanModality.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Plans',
        key: 'id',
      },
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
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "PlanModality",
  }
);