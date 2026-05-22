import { JwtPayload } from "jsonwebtoken";

export interface IToken extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role?: string;
}