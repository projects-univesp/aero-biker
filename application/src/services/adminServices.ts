import { AdminDTO } from "@dtos/admin";
import { Admin } from "@models/admin";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";
import { Op } from "sequelize";

export class AdminServices {
  get = async (id: string) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw logger.error("Admin not found", 404);

    const plain = admin.get({ plain: true }) as Record<string, unknown>;
    const { password: _, ...safeAdmin } = plain;

    return responseFormat({ message: "Admin found successfully", statusCode: 200, data: safeAdmin });
  };

  update = async (id: string, adminData: Partial<AdminDTO>) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw logger.error("Admin not found", 404);

    const phoneChanged = adminData.phone && adminData.phone !== admin.phone;
    const emailChanged = adminData.email && adminData.email !== admin.email;

    if (phoneChanged || emailChanged) {
      const orConditions = [];
      if (phoneChanged) orConditions.push({ phone: adminData.phone });
      if (emailChanged) orConditions.push({ email: adminData.email });

      const existing = await Admin.findOne({ where: { [Op.or]: orConditions } });
      if (existing) throw logger.error("Phone or email already in use", 409);
    }

    const dataToUpdate = { ...adminData };

    if (adminData.password) {
      if (!adminData.oldPassword) throw logger.error("Old password is required to change password", 400);

      const isPasswordValid = await compareHashPasswords(adminData.oldPassword, admin.password);
      if (!isPasswordValid) throw logger.error("Old password is incorrect", 401);

      dataToUpdate.password = await generateHashPassword(adminData.password);
    }

    delete dataToUpdate.oldPassword;

    const updatedAdmin = await admin.update(dataToUpdate);
    const plain = updatedAdmin.get({ plain: true }) as Record<string, unknown>;
    const { password: _, ...safeAdmin } = plain;

    return responseFormat({ message: "Admin updated successfully", statusCode: 200, data: safeAdmin });
  };

  delete = async (id: string) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw logger.error("Admin not found", 404);
    await admin.update({ isActive: false });

    return responseFormat({ message: "Admin deactivated successfully", statusCode: 200 });
  };
}
