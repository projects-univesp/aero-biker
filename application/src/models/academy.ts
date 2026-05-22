import { sequelize } from "@config/database";
import type { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Academy extends Model {
  declare id: UUID;
  declare name: string;
  declare cnpj: string | null;
  declare phone: string | null;
  declare address: string | null;
}

Academy.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cnpj: {
      type: DataTypes.STRING(18),
      allowNull: true,
      defaultValue: null,
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null,
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "Academy",
  },
);
