import { describe, it, expect, vi, beforeEach } from "vitest";

import { AdminServices } from "../../src/services/adminServices";
import { Admin } from "../../src/models/admin";
import { generateHashPassword, compareHashPasswords } from "../../src/utils/encrypt";

vi.mock("@models/admin");
vi.mock("@utils/encrypt");
vi.mock("@utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), silly: vi.fn(), trace: vi.fn(), fatal: vi.fn() },
}));

describe("Admin Services - Get", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();
  });

  it("Must get admin information successfully", async () => {
    const fakeAdmin = {
      id: "mock-uuid-123",
      name: "Jorge Admin",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed-password",
      isActive: true,
      get: vi.fn().mockReturnValue({
        id: "mock-uuid-123",
        name: "Jorge Admin",
        email: "admin@studio.com",
        phone: "11999999999",
        password: "hashed-password",
      }),
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdmin as any);

    const response = await adminServices.get("mock-uuid-123");

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin found successfully");
    expect(response.data.password).toBeUndefined();
  });

  it("Must throw 404 if admin is not found", async () => {
    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(adminServices.get("non-existent-id")).rejects.toThrow();
  });
});

describe("Admin Services - Update", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();
  });

  it("Must update admin name successfully", async () => {
    const fakeId = "mock-uuid-123";

    const fakeAdminInstance = {
      id: fakeId,
      name: "Jorge Admin",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed-old",
      update: vi.fn().mockResolvedValue({
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

    const response = await adminServices.update(fakeId, { name: "Jorge Atualizado" });

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin updated successfully");
    expect(fakeAdminInstance.update).toHaveBeenCalled();
  });

  it("Must throw 409 if phone or email is already in use", async () => {
    const fakeAdminInstance = {
      id: "mock-uuid-123",
      phone: "11999999999",
      email: "admin@studio.com",
      password: "hashed",
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);
    vi.mocked(Admin.findOne).mockResolvedValue({ id: "outro-uuid" } as any);

    await expect(adminServices.update("mock-uuid-123", { phone: "11888888888" })).rejects.toThrow();
  });

  it("Must update password successfully when old password is correct", async () => {
    const fakeId = "mock-uuid-123";

    const fakeAdminInstance = {
      id: fakeId,
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed-old",
      update: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue({
          id: fakeId,
          name: "Jorge",
          email: "admin@studio.com",
          phone: "11999999999",
          password: "new-hashed",
        }),
      }),
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(generateHashPassword).mockResolvedValue("new-hashed");

    const response = await adminServices.update(fakeId, { password: "novaSenha123", oldPassword: "senhaAntiga" });

    expect(response.statusCode).toBe(200);
  });

  it("Must throw 401 when old password is incorrect", async () => {
    const fakeAdminInstance = {
      id: "mock-uuid-123",
      email: "admin@studio.com",
      phone: "11999999999",
      password: "hashed-old",
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);

    await expect(
      adminServices.update("mock-uuid-123", { password: "nova", oldPassword: "errada" }),
    ).rejects.toThrow();
  });

  it("Must throw 404 if admin is not found", async () => {
    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(adminServices.update("non-existent-id", { name: "Teste" })).rejects.toThrow();
  });
});

describe("Admin Services - Delete (soft)", () => {
  let adminServices: AdminServices;

  beforeEach(() => {
    vi.clearAllMocks();
    adminServices = new AdminServices();
  });

  it("Must deactivate admin successfully", async () => {
    const fakeAdminInstance = {
      id: "mock-uuid-123",
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Admin.findByPk).mockResolvedValue(fakeAdminInstance as any);

    const response = await adminServices.delete("mock-uuid-123");

    expect(response.statusCode).toBe(200);
    expect(fakeAdminInstance.update).toHaveBeenCalledWith({ isActive: false });
  });

  it("Must throw 404 if admin is not found", async () => {
    vi.mocked(Admin.findByPk).mockResolvedValue(null);

    await expect(adminServices.delete("non-existent-id")).rejects.toThrow();
  });
});
