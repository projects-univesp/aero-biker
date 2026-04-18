import { JwtPayload } from "jsonwebtoken";

export interface IRequestDTO {
    code: string
}

export interface AuthDTO extends JwtPayload {
  id: string;
  name: string;
  password: string;
}