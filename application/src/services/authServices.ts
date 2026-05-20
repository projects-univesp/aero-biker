import { Admin } from "@models/admin";
import { SystemConfig } from "@models/systemConfig";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { env } from "@utils/env";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";
import { timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";

function makeError(message: string, statusCode: number): Error {
  const err = new Error(message);
  (err as Error & { statusCode: number }).statusCode = statusCode;
  return err;
}

function signToken(admin: Admin): string {
  return jwt.sign(
    {
      sub: admin.id,
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" },
  );
}

export class AuthServices {
  getSetupStatus = async () => {
    const config = await SystemConfig.findOne();
    return responseFormat({
      statusCode: 200,
      message: "Status retrieved",
      data: { setupCompleted: config?.setupCompleted ?? false },
    });
  };

  emailLogin = async (credentials: { email: string; password: string }) => {
    const admin = await Admin.findOne({
      where: { email: credentials.email, isActive: true },
    });

    const GENERIC_ERROR = "Email ou senha incorretos";

    if (!admin) {
      await generateHashPassword("dummy_bcrypt_delay_constant");
      throw makeError(GENERIC_ERROR, 401);
    }

    const passwordMatch = await compareHashPasswords(
      credentials.password,
      admin.password,
    );

    if (!passwordMatch) throw makeError(GENERIC_ERROR, 401);

    const token = signToken(admin);

    logger.info(`Login: admin ${admin.id} authenticated`);

    return responseFormat({
      statusCode: 200,
      message: "Login realizado com sucesso",
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  };

  setup = async (data: {
    name: string;
    email: string;
    password: string;
    masterPassword: string;
  }) => {
    const existingConfig = await SystemConfig.findOne();
    if (existingConfig?.setupCompleted) {
      throw makeError("Sistema já foi configurado", 409);
    }

    const existingAdmin = await Admin.count();
    if (existingAdmin > 0) {
      throw makeError("Sistema já possui usuários cadastrados", 409);
    }

    const [passwordHash, masterHash] = await Promise.all([
      generateHashPassword(data.password),
      generateHashPassword(data.masterPassword),
    ]);

    const admin = await Admin.create({
      name: data.name,
      email: data.email,
      password: passwordHash,
      isActive: true,
      role: "OWNER",
    });

    await SystemConfig.create({
      masterPasswordHash: masterHash,
      setupCompleted: true,
      createdBy: admin.id,
    });

    logger.info(`Setup: owner ${admin.id} created, system configured`);

    const token = signToken(admin);

    return responseFormat({
      statusCode: 201,
      message: "Sistema configurado com sucesso",
      data: { token },
    });
  };

  register = async (data: {
    name: string;
    email: string;
    password: string;
    masterPassword: string;
  }) => {
    const config = await SystemConfig.findOne();
    if (!config?.setupCompleted) {
      throw makeError("Sistema não configurado", 400);
    }

    const masterValid = await compareHashPasswords(
      data.masterPassword,
      config.masterPasswordHash,
    );

    if (!masterValid) {
      throw makeError("Senha mestre incorreta", 401);
    }

    const existing = await Admin.findOne({ where: { email: data.email } });
    if (existing) {
      throw makeError("Email já cadastrado", 409);
    }

    const passwordHash = await generateHashPassword(data.password);

    const admin = await Admin.create({
      name: data.name,
      email: data.email,
      password: passwordHash,
      isActive: true,
      role: "USER",
    });

    logger.info(
      `Register: user ${admin.id} created via master password authorization`,
    );

    return responseFormat({
      statusCode: 201,
      message: "Usuário criado com sucesso",
      data: { id: admin.id, name: admin.name, email: admin.email },
    });
  };

  resetPasswordWithMaster = async (data: {
    email: string;
    masterPassword: string;
    newPassword: string;
  }) => {
    const config = await SystemConfig.findOne();
    if (!config?.setupCompleted) {
      throw makeError("Sistema não configurado", 400);
    }

    const [masterValid, admin] = await Promise.all([
      compareHashPasswords(data.masterPassword, config.masterPasswordHash),
      Admin.findOne({ where: { email: data.email, isActive: true } }),
    ]);

    const GENERIC_ERROR =
      "Dados inválidos. Verifique o email e a senha mestre.";

    if (!masterValid || !admin) {
      throw makeError(GENERIC_ERROR, 401);
    }

    const newHash = await generateHashPassword(data.newPassword);
    await admin.update({ password: newHash, code: null, expiresAt: null });

    logger.info(
      `PasswordReset: user ${admin.id} password reset via master password`,
    );

    return responseFormat({
      statusCode: 200,
      message: "Senha redefinida com sucesso",
    });
  };

  resetMasterPassword = async (data: {
    recoveryKey: string;
    newMasterPassword: string;
  }) => {
    if (!env.MASTER_RECOVERY_KEY) {
      throw makeError("Recovery key não configurada no servidor", 501);
    }

    let keysMatch = false;
    try {
      const keyA = Buffer.from(data.recoveryKey);
      const keyB = Buffer.from(env.MASTER_RECOVERY_KEY);
      if (keyA.length === keyB.length) {
        keysMatch = timingSafeEqual(keyA, keyB);
      }
    } catch {
      keysMatch = false;
    }

    if (!keysMatch) {
      logger.warn("MasterRecovery: invalid recovery key attempt");
      throw makeError("Recovery key inválida", 401);
    }

    const config = await SystemConfig.findOne();
    if (!config) {
      throw makeError("Sistema não configurado", 400);
    }

    const newHash = await generateHashPassword(data.newMasterPassword);
    await config.update({ masterPasswordHash: newHash });

    logger.warn(
      "MasterRecovery: master password was reset via recovery key — all sensitive sessions should be considered invalid",
    );

    return responseFormat({
      statusCode: 200,
      message: "Senha mestre redefinida com sucesso",
    });
  };
}
