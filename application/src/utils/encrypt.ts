import bcrypt from "bcrypt";
import { env } from "@utils/env";

export async function generateHashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, env.SALT_RESULT);
  return hash;
}

export async function compareHashPasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}