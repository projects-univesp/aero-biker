import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Group extends Model {
  declare id: UUID;
  declare name: string;
  declare maxCapacity: number;
  declare daysOfWeek: string;
  declare time: string;
}

Group.init(
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
    maxCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    daysOfWeek: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Groups",
  },
);