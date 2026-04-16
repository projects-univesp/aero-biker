import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Subscription extends Model {
  declare id: UUID;
  declare studentId: UUID;
  declare planId: UUID;
  declare subscriptionValue: number;
  declare startDate: Date;
  declare renovationDate: Date;
  declare status: string;
  declare paymentMethod: string;
}

Subscription.init(
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
    planId: {
      type: DataTypes.UUID,
      references: {
        model: "Plans",
        key: "id",
      },
      allowNull: false,
    },
    subscriptionValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    renovationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Subscriptions",
  }
);
