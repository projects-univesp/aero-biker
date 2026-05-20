import express from "express";
import { appRouter } from "@routes/index";
import { env } from "@utils/env";
import { engine } from "express-handlebars";
import { errorHandler } from "@middlewares/error";
import path from "path";
import { logger } from "@utils/logger";
import { sequelize } from "@config/database";
import "@models/associations";
import { formatDate } from "@utils/dateFormat";
import { notFound } from "@middlewares/notFound";

const app = express();

// Trust a single proxy (nginx/caddy). Must come BEFORE rate limiters so req.ip is correct.
app.set("trust proxy", 1);

// HandleBars Config
app.engine(
  ".hbs",
  engine({
    defaultLayout: "main",
    extname: ".hbs",
    partialsDir: path.join(process.cwd(), env.VIEWS_PATH, "partials"),
    helpers: {
      formatDate,
      eq: (a: unknown, b: unknown) => a === b,
      formatCurrency: (value: number) => {
        if (value == null) return '';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      },
      formatDateShort: (date: string | Date) => {
        if (!date) return '';
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
      },
      substring: (str: string, start: number, end: number) => {
        if (!str) return '';
        return String(str).substring(start, end);
      },
    },
  }),
);

app.set("view engine", ".hbs");
app.set("views", path.join(process.cwd(), env.VIEWS_PATH));
app.use(express.static(path.join(process.cwd(), "public")));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(appRouter);
app.use(errorHandler);
app.use(notFound);

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
