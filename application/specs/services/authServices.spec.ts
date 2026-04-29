import { describe, it, expect, vi, beforeEach } from "vitest";

import { AuthServices } from "@services/authServices";
import { Admin } from "@models/admin";
import { compareHashPasswords } from "@utils/encrypt";
import jwt from "jsonwebtoken";

vi.mock("@models/admin");
vi.mock("@utils/encrypt", () => ({
  compareHashPasswords: vi.fn(),
}));
vi.mock("jsonwebtoken");

describe("Auth Services - EmailLogin", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    authServices = new AuthServices();
  });

  it("Must login successfully and return admin data with token", async () => {
    const fakeAdmin = {
      id: "mock-uuid-123",
      name: "Jorge Martins",
      email: "jorge@example.com",
      password: "hashed_password",
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(jwt.sign).mockReturnValue("mock-jwt-token" as any);

    const response = await authServices.emailLogin({
      email: "jorge@example.com",
      password: "senha123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin retrivied succesfully");
    expect(response.data.token).toBe("mock-jwt-token");
    expect(response.data.admin.id).toBe("mock-uuid-123");
    expect(response.data.admin.name).toBe("Jorge Martins");
    expect(response.data.admin.email).toBe("jorge@example.com");
  });

  it("Must throw a 401 error if email is not registered", async () => {
    vi.mocked(Admin.findOne).mockResolvedValue(null);

    await expect(
      authServices.emailLogin({ email: "inexistente@example.com", password: "senha" })
    ).rejects.toThrow();

    expect(compareHashPasswords).not.toHaveBeenCalled();
  });

  it("Must throw a 401 error if password does not match", async () => {
    const fakeAdmin = {
      id: "mock-uuid-123",
      name: "Jorge Martins",
      email: "jorge@example.com",
      password: "hashed_password",
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);

    await expect(
      authServices.emailLogin({ email: "jorge@example.com", password: "senha_errada" })
    ).rejects.toThrow();

    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
