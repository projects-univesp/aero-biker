import { env } from "./env";

export const COOKIE_NAME = "aero_session";

export const getCookieOptions = () => {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
    secure: isProduction,
    maxAge: env.JWT_EXPIRES_IN * 1000,
    path: "/",
  };
};

export const getBaseUrl = (): string => {
  return env.APP_URL;
};
