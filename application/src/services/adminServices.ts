import { MailClient } from "@config/mail";
import { AdminDTO } from "@dtos/admin";
import { Admin } from "@models/admin";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { template } from "@utils/mail";
import { responseFormat } from "@utils/responseFormat";
import { randomBytes } from "crypto";
import { Op } from "sequelize";

export class AdminServices {
  constructor(private readonly mail: MailClient = new MailClient()) {}

  create = async (adminData: Partial<AdminDTO>) => {
    const orConditions = [];
    orConditions.push({ phone: adminData.phone });
    orConditions.push({ email: adminData.email });

    const existingAdmin = await Admin.findOne({
      where: { [Op.or]: orConditions },
    });

    if (existingAdmin) {
      throw logger.error("Phone or email already in use", 409);
    }

    const hashedPassword = await generateHashPassword(adminData.password!);

    const createAdmin = await Admin.create({
      ...adminData,
      password: hashedPassword,
    });

    const { password, ...safeAdmin } = createAdmin;

    return responseFormat({
      message: "Admin created succesfully",
      statusCode: 201,
      data: safeAdmin,
    });
  };

  get = async (id: string) => {
    const admin = await Admin.findByPk(id);
    if (admin === null) throw logger.error("Admin not found", 404);

    const { password, ...safeAdmin } = admin;

    return responseFormat({
      message: "Admin found successfully",
      statusCode: 200,
      data: safeAdmin,
    });
  };

  forgotPassword = async (email: string) => {
    const admin = await Admin.findOne({
      where: { email: email },
    });
    if (admin === null) throw logger.error("Admin not found", 404);

    // Generate a random 6 char code
    const buffer = randomBytes(3);
    const hexString = buffer.toString("hex");
    const code = hexString.slice(0, 6);

    // Update code to table
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await admin.update({ code, expiresAt });

    // Send mail
    const html = template(admin.name, code);
    await this.mail.sendMail(email, "Recovery Code", html);

    return responseFormat({
      message: "Code sent successfully",
      statusCode: 200,
    });
  };

  resetPassword = async (email: string, code: string, newPassword: string) => {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) throw logger.error("Admin not found", 404);

    if (admin.code !== code) {
      throw logger.error("Invalid recovery code", 400);
    }

    if (!admin.expiresAt || new Date() > admin.expiresAt) {
      throw logger.error("Recovery code has expired", 400);
    }

    const hashedPassword = await generateHashPassword(newPassword);

    await admin.update({
      password: hashedPassword,
      code: null,
      expiresAt: null,
    });

    return responseFormat({
      message: "Password reset successfully",
      statusCode: 200,
    });
  };

  update = async (id: string, adminData: Partial<AdminDTO>) => {
    const admin = await Admin.findByPk(id);
    if (admin === null) throw logger.error("Admin not found", 404);

    const phoneChanged = adminData.phone && adminData.phone !== admin.phone;
    const emailChanged = adminData.email && adminData.email !== admin.email;

    if (phoneChanged || emailChanged) {
      const orConditions = [];
      if (phoneChanged) orConditions.push({ phone: adminData.phone });
      if (emailChanged) orConditions.push({ email: adminData.email });

      const existingAdmin = await Admin.findOne({
        where: { [Op.or]: orConditions },
      });

      if (existingAdmin) {
        throw logger.error("Phone or email already in use", 409);
      }
    }

    const dataToUpdate = { ...adminData };

    if (adminData.password) {
      if (!adminData.oldPassword) {
        throw logger.error("Old password is required to change password", 400);
      }

      const isPasswordValid = await compareHashPasswords(
        adminData.oldPassword,
        admin.password,
      );

      if (!isPasswordValid) {
        throw logger.error("Old password is incorrect", 401);
      }

      dataToUpdate.password = await generateHashPassword(adminData.password);
    }

    delete dataToUpdate.oldPassword;

    const updatedAdmin = await admin.update(dataToUpdate);

    const adminJSON = updatedAdmin.get({ plain: true });

    const { password, ...safeAdmin } = adminJSON;

    return responseFormat({
      message: "Admin updated successfully",
      statusCode: 200,
      data: safeAdmin,
    });
  };

  delete = async (id: string) => {
    const admin = await Admin.findByPk(id);
    if (admin === null) throw logger.error("Admin not found", 404);
    await admin.update({ isActive: false });

    return responseFormat({
      message: "Admin deactivated succesfully",
      statusCode: 200,
    });
  };
}
