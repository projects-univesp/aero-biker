import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Student extends Model {
    declare id: UUID
    declare name: string
    declare phone: number
    declare isActive: boolean
}

Student.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        phone: {
            type: DataTypes.NUMBER,
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: "Students",
    }
)