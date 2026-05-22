import { Admin } from "@models/admin";
import jwt from "jsonwebtoken";
import { env } from "./env";

export const signToken = (admin: Admin): string => {
  return jwt.sign(
    { sub: admin.id, id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" },
  );
}