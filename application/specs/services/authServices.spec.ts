import { describe, it, expect, vi, beforeEach } from "vitest";

import { AuthServices } from "../../src/services/authServices";
import { Admin } from "../../src/models/admin";
import { compareHashPasswords } from "../../src/utils/encrypt";
import jwt from "jsonwebtoken";

vi.mock("@models/admin");
vi.mock("@utils/encrypt");
vi.mock("jsonwebtoken");

describe("Auth Services - EmailLogin", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    authServices = new AuthServices();
  });

  it("Must login successfully and return token", async () => {
    const loginData = {
      email: "admin@studio.com",
      password: "senha123",
    };

    const fakeAdmin = {
      id: "mock-uuid-123",
      name: "Jorge Admin",
      email: "admin@studio.com",
      password: "hashed-password",
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(jwt.sign).mockReturnValue("mock-jwt-token" as any);

    const response = await authServices.emailLogin(loginData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Admin retrivied succesfully");
    expect(response.data.token).toBe("mock-jwt-token");
    expect(response.data.admin.id).toBe("mock-uuid-123");
  });

  it("Must throw a 401 error if email is not found", async () => {
    const loginData = {
      email: "notfound@test.com",
      password: "senha123",
    };

    vi.mocked(Admin.findOne).mockResolvedValue(null);

    await expect(authServices.emailLogin(loginData)).rejects.toThrow();

    expect(compareHashPasswords).not.toHaveBeenCalled();
  });

  it("Must throw a 401 error if password is incorrect", async () => {
    const loginData = {
      email: "admin@studio.com",
      password: "senha-errada",
    };

    const fakeAdmin = {
      id: "mock-uuid-123",
      email: "admin@studio.com",
      password: "hashed-password",
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);

    await expect(authServices.emailLogin(loginData)).rejects.toThrow();

    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
