import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().default(""),
  DB_HOST: z.string().default(""),
  DB_NAME: z.string().default(""),
  DB_USER: z.string().default(""),
  DB_PASSWORD: z.string().default(""),
  DB_PORT: z.coerce.number().default(5432),
  MAIL_HOST: z.string(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USER: z.string(),
  MAIL_PASS: z.string(),
  MAIL_FROM: z.string().default("Noreply <noreply@athena-devs.dev>"),
  MAIL_SECURE: z.string().transform((val) => val === 'true').default(false),
  JWT_SECRET: z.string().default(""),
  JWT_EXPIRES_IN: z.coerce.number().default(604800),
  SALT_RESULT: z.coerce.number().default(10),
  CORS_ORIGIN: z.string().default("http://localhost:5500"),
  VIEWS_PATH: z.enum(["views", "src/views"]).default("src/views"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variable", z.treeifyError(_env.error));

  throw new Error("❌ Invalid environment variables");
}

export const env = _env.data;
