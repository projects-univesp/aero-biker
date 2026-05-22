import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Schedule extends Model {
  declare id: UUID;

  declare title: string;
  declare category: string;
  declare level: string;
  declare description: string;

  declare date: string;
  declare startTime: string;
  declare endTime: string;

  declare currentStudents: number;
  declare isHoliday: boolean;
  declare isActive: boolean;

  declare groupId: UUID;
}

Schedule.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATE,
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

    currentStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    isHoliday: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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