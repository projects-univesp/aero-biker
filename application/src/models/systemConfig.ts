import { sequelize } from "@config/database";
import type { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class SystemConfig extends Model {
  declare id: UUID;
  declare masterPasswordHash: string;
  declare setupCompleted: boolean;
  declare createdBy: UUID | null;
}

SystemConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    masterPasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    setupCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "SystemConfig",
  },
);
