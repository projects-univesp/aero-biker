import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Auth extends Model {
  declare id: UUID;
  declare name: string;
  declare password: string;
}

Auth.init(
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
    password: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Auth",
  },
);
