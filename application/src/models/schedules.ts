import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Schedule extends Model {
  declare id: UUID;
  declare dayOfWeek: string;
  declare startTime: string;
  declare endTime: string;
  declare groupId: UUID;
}

Schedule.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    dayOfWeek: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
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
  },
  {
    sequelize,
    tableName: "Schedules",
  },
);
