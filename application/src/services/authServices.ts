import { Academy } from "@models/academy";
import { Admin } from "@models/admin";
import { env } from "@utils/env";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";
import jwt from "jsonwebtoken";
import { MailClient } from "@config/mail";
import { TokenService } from "./tokenService";
import { signToken } from "@utils/auth";
import { template } from "@utils/mail";

export class AuthServices {
  constructor(
    private readonly tokenService = new TokenService(),
    private readonly mailClient = new MailClient(),
  ) {}

  isSetupComplete = async (): Promise<boolean> => {
    const count = await Admin.count();
    return count > 0;
  };

  getSetupStatus = async () => {
    const setupCompleted = await this.isSetupComplete();
    return responseFormat.send({ statusCode: 200, message: "Status retrieved", data: { setupCompleted } });
  };

  setup = async (data: {
    academyName: string;
    name: string;
    email: string;
    password: string;
  }) => {
    const setupDone = await this.isSetupComplete();
    if (setupDone) responseFormat.error("Sistema já configurado", 409);

    const passwordHash = await generateHashPassword(data.password);

    const [admin] = await Promise.all([
      Admin.create({ name: data.name, email: data.email, password: passwordHash, isActive: true, role: "OWNER" }),
      Academy.create({ name: data.academyName }),
    ]);

    logger.info(`Setup: owner ${admin.id} created`);

    const token = signToken(admin);

    return responseFormat.send({
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
      return responseFormat.error(GENERIC_ERROR, 401);
    }

    const passwordMatch = await compareHashPasswords(credentials.password, admin.password);
    if (!passwordMatch) {
      logger.warn(`Login failed: wrong password for admin ${admin.id}`);
      return responseFormat.error(GENERIC_ERROR, 401);
    }

    const token = signToken(admin);
    logger.info(`Login: admin ${admin.id} authenticated`);

    return responseFormat.send({
      statusCode: 200,
      message: "Login realizado com sucesso",
      data: { token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } },
    });
  };

  forgotPassword = async (email: string, baseUrl: string) => {
    const admin = await Admin.findOne({ where: { email, isActive: true } });

    // Always return 200 to prevent user enumeration
    if (!admin) {
      return responseFormat.send({ statusCode: 200, message: "Se o email existir, você receberá um link de recuperação" });
    }

    const token = await this.tokenService.create(admin.id);
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const html = template(admin.name, resetUrl);

    await this.mailClient.sendMail(admin.email, admin.name, html);

    logger.info(`ForgotPassword: reset link sent to admin ${admin.id}`);

    return responseFormat.send({ statusCode: 200, message: "Se o email existir, você receberá um link de recuperação" });
  };

  resetPassword = async (token: string, newPassword: string) => {
    const result = await this.tokenService.consume(token as `${string}`);

    if (!result) responseFormat.error("Token inválido ou expirado", 400);

    const admin = await Admin.findByPk(result.adminId);
    if (!admin || !admin.isActive) responseFormat.error("Usuário não encontrado", 404);

    const passwordHash = await generateHashPassword(newPassword);
    await admin.update({ password: passwordHash });

    logger.info(`ResetPassword: password updated for admin ${admin.id}`);

    return responseFormat.send({ statusCode: 200, message: "Senha redefinida com sucesso" });
  };
}
