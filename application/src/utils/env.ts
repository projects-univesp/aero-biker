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
  APP_URL: z.string().url().default("http://localhost:3333"),
  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM: z.string().default("AEROBIC BIKER <noreply@aerobicbiker.com.br>"),
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

if (!env.RESEND_API_KEY) {
  if (isProd) throw new Error("❌ RESEND_API_KEY must be set in production");
  console.warn("⚠️  RESEND_API_KEY is not set — password recovery emails will fail");
}
