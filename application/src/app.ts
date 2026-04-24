import express from "express";
import { appRouter } from "@routes/index";
import { env } from "@utils/env";
import { engine } from "express-handlebars";
import path from "path";
import { logger } from "@utils/logger";
import { sequelize } from "@config/database";
import "@models/associations";
import { formatDate } from "@utils/dateFormat";

const app = express();

// HandleBars Config
app.engine(
  ".hbs",
  engine({
    defaultLayout: "main",
    extname: ".hbs",
    partialsDir: path.join(process.cwd(), env.VIEWS_PATH, "partials"),
    helpers: { formatDate },
  }),
);

app.set("view engine", ".hbs");
app.set("views", path.join(process.cwd(), env.VIEWS_PATH));
app.use(express.static(path.join(process.cwd(), "public")));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(appRouter);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection stablished successfully");

    await sequelize.sync({ alter: true });
    logger.info("Database synced successfully");

    app.listen(env.PORT, () => {
      logger.info(`Server running at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error("Fatal error unable to connect with database", error);
    process.exit(1);
  }
};

startServer();
