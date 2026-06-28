import { AdminDTO } from "@dtos/admin";
import { AdminMapper } from "@utils/mappers/admin";
import { Admin } from "@models/admin";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";
import { Op } from "sequelize";

export class AdminServices {
  private safeAdmin = AdminMapper.toSafeObject
  
  get = async (id: string) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw new AppError("Admin not found", 404);

    return this.safeAdmin(admin);
  };

  update = async (id: string, adminData: Partial<AdminDTO>) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw new AppError("Admin not found", 404);

    const phoneChanged = adminData.phone && adminData.phone !== admin.phone;
    const emailChanged = adminData.email && adminData.email !== admin.email;

    if (phoneChanged || emailChanged) {
      const orConditions = [];
      if (phoneChanged) orConditions.push({ phone: adminData.phone });
      if (emailChanged) orConditions.push({ email: adminData.email });

      const existing = await Admin.findOne({ where: { [Op.or]: orConditions } });
      if (existing) throw new AppError("Phone or email already in use", 409);
    }

    const dataToUpdate = { ...adminData };

    if (adminData.password) {
      if (!adminData.oldPassword) throw new AppError("Old password is required to change password", 400);

      const isPasswordValid = await compareHashPasswords(adminData.oldPassword!, admin.password);
      if (!isPasswordValid) throw new AppError("Old password is incorrect", 401);

      dataToUpdate.password = await generateHashPassword(adminData.password);
    }

    delete dataToUpdate.oldPassword;

    const updatedAdmin = await admin.update(dataToUpdate);

    return this.safeAdmin(updatedAdmin);
  };

  delete = async (id: string) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw new AppError("Admin not found", 404);
    await admin.update({ isActive: false });
  };
}
