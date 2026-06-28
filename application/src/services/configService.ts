import { Academy } from "@models/academy";
import { Admin } from "@models/admin";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";
import { AdminMapper } from "@mappers/admin";

export class ConfigService {
  private safeAdmin = AdminMapper.toSafeObject;

  getAcademy = async () => {
    const academy = await Academy.findOne();
    return academy;
  };

  updateAcademy = async (data: {
    name?: string;
    cnpj?: string;
    phone?: string;
    address?: string;
  }) => {
    const academy = await Academy.findOne();
    if (!academy) throw new AppError("Academia não encontrada", 404);

    await academy.update(data);

    return academy;
  };

  listAdmins = async () => {
    const admins = await Admin.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "isActive",
        "phone",
        "createdAt",
      ],
      order: [["createdAt", "ASC"]],
    });
    return admins;
  };

  createAdmin = async (data: {
    name: string;
    email: string;
    password: string;
    role?: "ADMIN" | "USER";
  }) => {
    const existing = await Admin.findOne({ where: { email: data.email } });
    if (existing) throw new AppError("Email já cadastrado", 409);

    const passwordHash = await generateHashPassword(data.password);
    const admin = await Admin.create({
      name: data.name,
      email: data.email,
      password: passwordHash,
      isActive: true,
      role: data.role ?? "USER",
    });

    logger.info(`ConfigService: admin ${admin.id} created`);

    return this.safeAdmin(admin)
  };

  changePassword = async (
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ) => {
    const admin = await Admin.findByPk(adminId);
    if (!admin) throw new AppError("Usuário não encontrado", 404);

    const valid = await compareHashPasswords(currentPassword, admin.password);
    if (!valid) throw new AppError("Senha atual incorreta", 401);

    const passwordHash = await generateHashPassword(newPassword);
    await admin.update({ password: passwordHash });

    logger.info(`ConfigService: password changed for admin ${admin.id}`);
  };

  deactivateAdmin = async (targetId: string, requesterId: string) => {
    if (targetId === requesterId)
      throw new AppError(
        "Você não pode desativar sua própria conta",
        400,
      );

    const admin = await Admin.findByPk(targetId);
    if (!admin) throw new AppError("Usuário não encontrado", 404);
    if (admin.role === "OWNER")
      throw new AppError(
        "Não é possível desativar o proprietário",
        403,
      );

    await admin.update({ isActive: false });

    logger.info(
      `ConfigService: admin ${targetId} deactivated by ${requesterId}`,
    );
  };

  reactivateAdmin = async (targetId: string) => {
    const admin = await Admin.findByPk(targetId);
    if (!admin) throw new AppError("Usuário não encontrado", 404);

    await admin.update({ isActive: true });
  };
}
