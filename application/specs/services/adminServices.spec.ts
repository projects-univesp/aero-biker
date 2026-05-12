import { describe, it, expect, vi, beforeEach } from "vitest";

import { AdminServices } from "@services/adminServices";
import { Admin } from "@models/admin";
import { generateHashPassword, compareHashPasswords } from "@utils/encrypt";

vi.mock("@models/admin");
vi.mock("@utils/encrypt");

describe("Admin Services - Create", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();

vi.mock("@models/admin");
vi.mock("@utils/encrypt", () => ({
  generateHashPassword: vi.fn(),
  compareHashPasswords: vi.fn(),
}));

  it("Must create an admin successfully", async () => {
    const adminData = {
      name: "Jorge Martins",
      phone: "11999999999",
      email: "jorge@example.com",
      password: "senha123",
      isActive: true,
    };

    vi.mocked(Admin.count).mockResolvedValue(0);
    vi.mocked(generateHashPassword).mockResolvedValue("hashed_senha123");

    vi.mocked(Admin.create).mockResolvedValue({
      id: "mock-uuid-123",
      ...adminData,
      password: "hashed_senha123",
      get: vi.fn().mockReturnValue({
        id: "mock-uuid-123",
        name: "Jorge Martins",
        phone: "11999999999",
        email: "jorge@example.com",
        password: "hashed_senha123",
        isActive: true,
      }),
    } as any);

    const response = await adminServices.create(adminData);

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Admin created succesfully");
    expect(response.data.id).toBe("mock-uuid-123");
    expect(response.data.password).toBeUndefined();
  });

  it("Must throw a 403 error if an admin already exists", async () => {
    vi.mocked(Admin.count).mockResolvedValue(1);

    await expect(
      adminServices.create({ name: "Jorge", email: "jorge@example.com", password: "senha" })
    ).rejects.toThrow();

    expect(Admin.create).not.toHaveBeenCalled();
  });
});

describe("Admin Services - Get", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();
  });

  it("Must get admin information successfully", async () => {
    const fakeId = "mock-uuid-123";
    const fakeAdmin = {
      id: fakeId,
      name: "Jorge Martins",
      phone: "11999999999",
      email: "jorge@example.com",
      password: "hashed_password",
      isActive: true,
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdmin as any);

    const response = await adminServices.get(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin found successfully");
    expect(response.data.name).toBe("Jorge Martins");
    expect(response.data.password).toBeUndefined();
  });

  it("Must throw a 404 error if admin is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(adminServices.get(fakeId)).rejects.toThrow();

    expect(Admin.findByPk).toHaveBeenCalledWith(fakeId);
  });
});

describe("Admin Services - ForgotPassword", () => {
  let adminServices: AdminServices;
  let mockMail: { sendMail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMail = { sendMail: vi.fn().mockResolvedValue(undefined) };
    adminServices = new AdminServices(mockMail as any);
  });

  it("Must send recovery code successfully", async () => {
    const fakeAdmin = {
      name: "Jorge Martins",
      email: "jorge@example.com",
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);

    const response = await adminServices.forgotPassword("jorge@example.com");

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Code sent successfully");
    expect(fakeAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: expect.any(Date) })
    );
    expect(mockMail.sendMail).toHaveBeenCalledWith(
      "jorge@example.com",
      "Recovery Code",
      expect.any(String)
    );
  });

  it("Must throw a 404 error if admin email is not found", async () => {
    vi.mocked(Admin.findOne).mockResolvedValue(null);

    await expect(
      adminServices.forgotPassword("inexistente@example.com")
    ).rejects.toThrow();

    expect(mockMail.sendMail).not.toHaveBeenCalled();
  });
});

describe("Admin Services - ResetPassword", () => {
  let adminServices: AdminServices;
  let mockMail: { sendMail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMail = { sendMail: vi.fn().mockResolvedValue(undefined) };
    adminServices = new AdminServices(mockMail as any);
  });

  it("Must reset password successfully", async () => {
    const fakeAdmin = {
      email: "jorge@example.com",
      code: "abc123",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(generateHashPassword).mockResolvedValue("new_hashed_password");

    const response = await adminServices.resetPassword(
      "jorge@example.com",
      "abc123",
      "newPassword"
    );

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Password reset successfully");
    expect(fakeAdmin.update).toHaveBeenCalledWith({
      password: "new_hashed_password",
      code: null,
      expiresAt: null,
    });
  });

  it("Must throw a 404 error if admin is not found", async () => {
    vi.mocked(Admin.findOne).mockResolvedValue(null);

    await expect(
      adminServices.resetPassword("inexistente@example.com", "abc123", "newPassword")
    ).rejects.toThrow();
  });

  it("Must throw a 400 error if recovery code is incorrect", async () => {
    const fakeAdmin = {
      email: "jorge@example.com",
      code: "abc123",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);

    await expect(
      adminServices.resetPassword("jorge@example.com", "codigo-errado", "newPassword")
    ).rejects.toThrow();
  });

  it("Must throw a 400 error if recovery code has expired", async () => {
    const fakeAdmin = {
      email: "jorge@example.com",
      code: "abc123",
      expiresAt: new Date(Date.now() - 1000),
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);

    await expect(
      adminServices.resetPassword("jorge@example.com", "abc123", "newPassword")
    ).rejects.toThrow();
  });
});

describe("Admin Services - Update", () => {
  let adminServices: AdminServices;
  let mockMail: { sendMail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMail = { sendMail: vi.fn().mockResolvedValue(undefined) };
    adminServices = new AdminServices(mockMail as any);
  });

  it("Must update admin information successfully", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = { name: "Jorge Atualizado" };

    const fakeAdminInstance = {
      id: fakeId,
      name: "Jorge",
      phone: "11999999999",
      email: "jorge@example.com",
      password: "hashed_password",
      isActive: true,
      update: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue({
          id: fakeId,
          name: "Jorge Atualizado",
          phone: "11999999999",
          email: "jorge@example.com",
          password: "hashed_password",
          isActive: true,
        }),
      }),
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);

    const response = await adminServices.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin updated successfully");
    expect(response.data.name).toBe("Jorge Atualizado");
    expect(response.data.password).toBeUndefined();
    expect(fakeAdminInstance.update).toHaveBeenCalledWith(updateData);
  });

  it("Must throw a 404 error if admin is not found", async () => {
    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(
      adminServices.update("non-existent-id", { name: "Teste" })
    ).rejects.toThrow();
  });

  it("Must throw a 409 error if phone or email is already in use", async () => {
    const fakeId = "mock-uuid-123";

    const fakeAdminInstance = {
      id: fakeId,
      phone: "11999999999",
      email: "jorge@example.com",
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);
    vi.mocked(Admin.findOne).mockResolvedValue({ id: "outro-admin-uuid" } as any);

    await expect(
      adminServices.update(fakeId, { phone: "11888888888" })
    ).rejects.toThrow();
  });

  it("Must throw a 400 error if new password is provided without old password", async () => {
    const fakeId = "mock-uuid-123";

    const fakeAdminInstance = {
      id: fakeId,
      phone: "11999999999",
      email: "jorge@example.com",
      password: "hashed_password",
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);

    await expect(
      adminServices.update(fakeId, { password: "novaSenha" })
    ).rejects.toThrow();

    expect(compareHashPasswords).not.toHaveBeenCalled();
  });

  it("Must throw a 401 error if old password is incorrect", async () => {
    const fakeId = "mock-uuid-123";

    const fakeAdminInstance = {
      id: fakeId,
      phone: "11999999999",
      email: "jorge@example.com",
      password: "hashed_password",
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);

    await expect(
      adminServices.update(fakeId, { password: "novaSenha", oldPassword: "senhaErrada" })
    ).rejects.toThrow();

    expect(generateHashPassword).not.toHaveBeenCalled();
  });
});

describe("Admin Services - Delete", () => {
  let adminServices: AdminServices;
  let mockMail: { sendMail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMail = { sendMail: vi.fn().mockResolvedValue(undefined) };
    adminServices = new AdminServices(mockMail as any);
  });

  it("Must deactivate admin successfully", async () => {
    const fakeId = "mock-uuid-123";

    const fakeAdminInstance = {
      id: fakeId,
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);

    const response = await adminServices.delete(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin deactivated succesfully");
    expect(fakeAdminInstance.update).toHaveBeenCalledWith({ isActive: false });
  });

  it("Must throw a 404 error if admin is not found", async () => {
    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(adminServices.delete("non-existent-id")).rejects.toThrow();
  });
});
