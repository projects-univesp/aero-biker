import { env } from "@utils/env";
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
    host: env.DB_HOST,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    dialect: "postgres",
    port: env.DB_PORT
})