import { Academy } from "@models/academy";
import { Admin } from "@models/admin";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

function makeError(message: string, statusCode: number): Error {
  const err = new Error(message);
  (err as Error & { statusCode: number }).statusCode = statusCode;
  return err;
}

function safeAdmin(admin: Admin) {
  const plain = admin.get({ plain: true }) as Record<string, unknown>;
  const { password: _, ...rest } = plain;
  return rest;
}

export class ConfigService {
  getAcademy = async () => {
    const academy = await Academy.findOne();
    return responseFormat({ statusCode: 200, message: "Academy retrieved", data: academy });
  };

  updateAcademy = async (data: { name?: string; cnpj?: string; phone?: string; address?: string }) => {
    const academy = await Academy.findOne();
    if (!academy) throw makeError("Academia não encontrada", 404);

    await academy.update(data);

    return responseFormat({ statusCode: 200, message: "Academia atualizada com sucesso", data: academy });
  };

  listAdmins = async () => {
    const admins = await Admin.findAll({
      attributes: ["id", "name", "email", "role", "isActive", "phone", "createdAt"],
      order: [["createdAt", "ASC"]],
    });
    return responseFormat({ statusCode: 200, message: "Admins retrieved", data: admins });
  };

  createAdmin = async (data: { name: string; email: string; password: string; role?: "ADMIN" | "USER" }) => {
    const existing = await Admin.findOne({ where: { email: data.email } });
    if (existing) throw makeError("Email já cadastrado", 409);

    const passwordHash = await generateHashPassword(data.password);
    const admin = await Admin.create({
      name: data.name,
      email: data.email,
      password: passwordHash,
      isActive: true,
      role: data.role ?? "USER",
    });

    logger.info(`ConfigService: admin ${admin.id} created`);

    return responseFormat({ statusCode: 201, message: "Usuário criado com sucesso", data: safeAdmin(admin) });
  };

  changePassword = async (adminId: string, currentPassword: string, newPassword: string) => {
    const admin = await Admin.findByPk(adminId);
    if (!admin) throw makeError("Usuário não encontrado", 404);

    const valid = await compareHashPasswords(currentPassword, admin.password);
    if (!valid) throw makeError("Senha atual incorreta", 401);

    const passwordHash = await generateHashPassword(newPassword);
    await admin.update({ password: passwordHash });

    logger.info(`ConfigService: password changed for admin ${admin.id}`);

    return responseFormat({ statusCode: 200, message: "Senha alterada com sucesso" });
  };

  deactivateAdmin = async (targetId: string, requesterId: string) => {
    if (targetId === requesterId) throw makeError("Você não pode desativar sua própria conta", 400);

    const admin = await Admin.findByPk(targetId);
    if (!admin) throw makeError("Usuário não encontrado", 404);
    if (admin.role === "OWNER") throw makeError("Não é possível desativar o proprietário", 403);

    await admin.update({ isActive: false });

    logger.info(`ConfigService: admin ${targetId} deactivated by ${requesterId}`);

    return responseFormat({ statusCode: 200, message: "Usuário desativado com sucesso" });
  };

  reactivateAdmin = async (targetId: string) => {
    const admin = await Admin.findByPk(targetId);
    if (!admin) throw makeError("Usuário não encontrado", 404);

    await admin.update({ isActive: true });

    return responseFormat({ statusCode: 200, message: "Usuário reativado com sucesso" });
  };
}
