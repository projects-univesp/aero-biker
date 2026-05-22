import { sequelize } from "@config/database";
import type { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class PasswordReset extends Model {
  declare id: UUID;
  declare tokenHash: string;
  declare adminId: UUID;
  declare expiresAt: Date;
  declare usedAt: Date | null;
}

PasswordReset.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "Admin", key: "id" },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "PasswordResets",
  },
);
