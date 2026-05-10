import { describe, it, expect, vi, beforeEach } from "vitest";

import { AdminServices } from "../../src/services/adminServices";
import { Admin } from "../../src/models/admin";
import { generateHashPassword, compareHashPasswords } from "../../src/utils/encrypt";

vi.mock("@models/admin");
vi.mock("@utils/encrypt");

describe("Admin Services - Create", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();
  });

  it("Must create an admin successfully", async () => {
    const adminData = {
      name: "Jorge Admin",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "senha123",
    };

    vi.mocked(Admin.count).mockResolvedValue(0);
    vi.mocked(generateHashPassword).mockResolvedValue("hashed-password");

    vi.mocked(Admin.create).mockResolvedValue({
      id: "mock-uuid-123",
      ...adminData,
      password: "hashed-password",
      get: vi.fn().mockReturnValue({
        id: "mock-uuid-123",
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone,
        password: "hashed-password",
      }),
    } as any);

    const response = await adminServices.create(adminData);

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Admin created succesfully");
    expect(response.data.id).toBe("mock-uuid-123");
  });

  it("Must throw a 403 error if an admin already exists", async () => {
    const adminData = {
      name: "Jorge Admin",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "senha123",
    };

    vi.mocked(Admin.count).mockResolvedValue(1);

    await expect(adminServices.create(adminData)).rejects.toThrow();

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
      name: "Jorge Admin",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed-password",
      isActive: true,
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdmin as any);

    const response = await adminServices.get(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin found successfully");
  });

  it("Must throw a 404 error if admin is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(adminServices.get(fakeId)).rejects.toThrow();
  });
});

describe("Admin Services - ForgotPassword", () => {
  let adminServices: AdminServices;
  let mockSendMail: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail = vi.fn().mockResolvedValue(undefined);
    adminServices = new AdminServices({ sendMail: mockSendMail } as any);
  });

  it("Must send recovery code successfully", async () => {
    const fakeAdmin = {
      name: "Jorge Admin",
      email: "admin@studio.com",
      code: null,
      expiresAt: null,
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);

    const response = await adminServices.forgotPassword("admin@studio.com");

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Code sent successfully");
    expect(fakeAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        code: expect.any(String),
        expiresAt: expect.any(Date),
      })
    );
    expect(mockSendMail).toHaveBeenCalled();
  });

  it("Must throw a 404 error if admin is not found", async () => {
    vi.mocked(Admin.findOne).mockResolvedValue(null);

    await expect(adminServices.forgotPassword("notfound@test.com")).rejects.toThrow();

    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

describe("Admin Services - ResetPassword", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();
  });

  it("Must reset password successfully", async () => {
    const fakeAdmin = {
      email: "admin@studio.com",
      code: "abc123",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(generateHashPassword).mockResolvedValue("new-hashed-password");

    const response = await adminServices.resetPassword("admin@studio.com", "abc123", "novaSenha123");

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Password reset successfully");
    expect(fakeAdmin.update).toHaveBeenCalledWith({
      password: "new-hashed-password",
      code: null,
      expiresAt: null,
    });
  });

  it("Must throw a 404 error if admin is not found", async () => {
    vi.mocked(Admin.findOne).mockResolvedValue(null);

    await expect(adminServices.resetPassword("notfound@test.com", "abc123", "novaSenha")).rejects.toThrow();
  });

  it("Must throw a 400 error if recovery code is invalid", async () => {
    const fakeAdmin = {
      email: "admin@studio.com",
      code: "abc123",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      update: vi.fn(),
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);

    await expect(adminServices.resetPassword("admin@studio.com", "wrong-code", "novaSenha")).rejects.toThrow();

    expect(fakeAdmin.update).not.toHaveBeenCalled();
  });

  it("Must throw a 400 error if recovery code is expired", async () => {
    const fakeAdmin = {
      email: "admin@studio.com",
      code: "abc123",
      expiresAt: new Date(Date.now() - 1000),
      update: vi.fn(),
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);

    await expect(adminServices.resetPassword("admin@studio.com", "abc123", "novaSenha")).rejects.toThrow();

    expect(fakeAdmin.update).not.toHaveBeenCalled();
  });
});

describe("Admin Services - Update", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();
  });

  it("Must update admin successfully", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = { name: "Jorge Atualizado" };

    const fakeAdminInstance = {
      id: fakeId,
      name: "Jorge Admin",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed-old",
      update: vi.fn().mockResolvedValue({
        id: fakeId,
        name: "Jorge Atualizado",
        email: "admin@studio.com",
        phone: "11999999999",
        password: "hashed-old",
        get: vi.fn().mockReturnValue({
          id: fakeId,
          name: "Jorge Atualizado",
          email: "admin@studio.com",
          phone: "11999999999",
          password: "hashed-old",
        }),
      }),
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);

    const response = await adminServices.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin updated successfully");
    expect(fakeAdminInstance.update).toHaveBeenCalled();
  });

  it("Must throw a 409 error if phone or email is already in use", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = { phone: "11888888888" };

    const fakeAdminInstance = {
      id: fakeId,
      name: "Jorge Admin",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed",
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);
    vi.mocked(Admin.findOne).mockResolvedValue({ id: "outro-admin-uuid" } as any);

    await expect(adminServices.update(fakeId, updateData)).rejects.toThrow();
  });

  it("Must update admin password successfully", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = { password: "novaSenha123", oldPassword: "senhaAntiga" };

    const fakeAdminInstance = {
      id: fakeId,
      name: "Jorge Admin",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed-old",
      update: vi.fn().mockResolvedValue({
        id: fakeId,
        name: "Jorge Admin",
        email: "admin@studio.com",
        phone: "11999999999",
        password: "new-hashed",
        get: vi.fn().mockReturnValue({
          id: fakeId,
          name: "Jorge Admin",
          email: "admin@studio.com",
          phone: "11999999999",
          password: "new-hashed",
        }),
      }),
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(generateHashPassword).mockResolvedValue("new-hashed");

    const response = await adminServices.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin updated successfully");
  });

  it("Must throw a 401 error if old password is incorrect", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = { password: "novaSenha123", oldPassword: "senhaErrada" };

    const fakeAdminInstance = {
      id: fakeId,
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed-old",
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);

    await expect(adminServices.update(fakeId, updateData)).rejects.toThrow();
  });

  it("Must throw a 404 error if admin is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(adminServices.update(fakeId, { name: "Teste" })).rejects.toThrow();
  });
});

describe("Admin Services - Delete", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();
  });

  it("Must fake delete admin successfully", async () => {
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
    const fakeId = "non-existent-id";

    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(adminServices.delete(fakeId)).rejects.toThrow();
  });
});
