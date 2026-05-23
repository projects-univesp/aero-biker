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
  JWT_SECRET: z.string().default(""),
  JWT_EXPIRES_IN: z.coerce.number().default(604800),
  SALT_RESULT: z.coerce.number().default(10),
  CORS_ORIGIN: z.string().default("http://localhost:5500"),
  VIEWS_PATH: z.enum(["views", "src/views"]).default("src/views"),
  APP_URL: z.url().default("http://localhost:3333"),
  MAIL_HOST: z.string(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USER: z.string(),
  MAIL_PASS: z.string(),
  MAIL_FROM: z.string().default("Noreply <noreply@athena-devs.dev>"),
  MAIL_SECURE: z.string().transform((val) => val === 'true').default(false)
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variable", z.treeifyError(_env.error));
  throw new Error("❌ Invalid environment variables");
}

export const env = _env.data;

const isProd = env.NODE_ENV === "production";

if (!env.JWT_SECRET) {
  if (isProd) throw new Error("❌ JWT_SECRET must be set in production");
  console.warn("⚠️  JWT_SECRET is empty — using insecure default (dev only)");
}
