import { Admin } from "@models/admin";

export const AdminMapper = {
  toSafeObject: (admin: Admin) => {
    const plain = admin.get({ plain: true }) as Record<string, unknown>;
    const { password, ...rest } = plain;
    return rest;
  }
};