import { Academy } from "@models/academy";
import { Admin } from "@models/admin";
import { env } from "@utils/env";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";
import jwt from "jsonwebtoken";
import { MailService } from "./mailService";
import { TokenService } from "./tokenService";

function makeError(message: string, statusCode: number): Error {
  const err = new Error(message);
  (err as Error & { statusCode: number }).statusCode = statusCode;
  return err;
}

function signToken(admin: Admin): string {
  return jwt.sign(
    { sub: admin.id, id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" },
  );
}

export class AuthServices {
  constructor(
    private readonly tokenService = new TokenService(),
    private readonly mailService = new MailService(),
  ) {}

  isSetupComplete = async (): Promise<boolean> => {
    const count = await Admin.count();
    return count > 0;
  };

  getSetupStatus = async () => {
    const setupCompleted = await this.isSetupComplete();
    return responseFormat({ statusCode: 200, message: "Status retrieved", data: { setupCompleted } });
  };

  setup = async (data: {
    academyName: string;
    name: string;
    email: string;
    password: string;
  }) => {
    const setupDone = await this.isSetupComplete();
    if (setupDone) throw makeError("Sistema já configurado", 409);

    const passwordHash = await generateHashPassword(data.password);

    const [admin] = await Promise.all([
      Admin.create({ name: data.name, email: data.email, password: passwordHash, isActive: true, role: "OWNER" }),
      Academy.create({ name: data.academyName }),
    ]);

    logger.info(`Setup: owner ${admin.id} created`);

    const token = signToken(admin);

    return responseFormat({
      statusCode: 201,
      message: "Sistema configurado com sucesso",
      data: { token },
    });
  };

  login = async (credentials: { email: string; password: string }) => {
    const GENERIC_ERROR = "Email ou senha incorretos";

    const admin = await Admin.findOne({ where: { email: credentials.email, isActive: true } });

    if (!admin) {
      await generateHashPassword("dummy_bcrypt_delay_constant");
      logger.warn(`Login failed: email not found [${credentials.email}]`);
      throw makeError(GENERIC_ERROR, 401);
    }

    const passwordMatch = await compareHashPasswords(credentials.password, admin.password);
    if (!passwordMatch) {
      logger.warn(`Login failed: wrong password for admin ${admin.id}`);
      throw makeError(GENERIC_ERROR, 401);
    }

    const token = signToken(admin);
    logger.info(`Login: admin ${admin.id} authenticated`);

    return responseFormat({
      statusCode: 200,
      message: "Login realizado com sucesso",
      data: { token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } },
    });
  };

  forgotPassword = async (email: string, baseUrl: string) => {
    const admin = await Admin.findOne({ where: { email, isActive: true } });

    // Always return 200 to prevent user enumeration
    if (!admin) {
      return responseFormat({ statusCode: 200, message: "Se o email existir, você receberá um link de recuperação" });
    }

    const token = await this.tokenService.create(admin.id);
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await this.mailService.sendPasswordReset(admin.email, admin.name, resetUrl);

    logger.info(`ForgotPassword: reset link sent to admin ${admin.id}`);

    return responseFormat({ statusCode: 200, message: "Se o email existir, você receberá um link de recuperação" });
  };

  resetPassword = async (token: string, newPassword: string) => {
    const result = await this.tokenService.consume(token as `${string}`);

    if (!result) throw makeError("Token inválido ou expirado", 400);

    const admin = await Admin.findByPk(result.adminId);
    if (!admin || !admin.isActive) throw makeError("Usuário não encontrado", 404);

    const passwordHash = await generateHashPassword(newPassword);
    await admin.update({ password: passwordHash });

    logger.info(`ResetPassword: password updated for admin ${admin.id}`);

    return responseFormat({ statusCode: 200, message: "Senha redefinida com sucesso" });
  };
}
