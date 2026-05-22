import { describe, it, expect, vi, beforeEach } from "vitest";

import { AuthServices } from "../../src/services/authServices";
import { Admin } from "../../src/models/admin";
import { Academy } from "../../src/models/academy";
import { compareHashPasswords, generateHashPassword } from "../../src/utils/encrypt";
import jwt from "jsonwebtoken";

vi.mock("@models/admin");
vi.mock("@models/academy");
vi.mock("@utils/encrypt");
vi.mock("jsonwebtoken");

// Mock Resend before mailService is imported
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  })),
}));

const mockEnv = vi.hoisted(() => ({
  JWT_SECRET: "test-secret-key",
  JWT_EXPIRES_IN: 604800,
  NODE_ENV: "test",
  SALT_RESULT: 10,
  RESEND_API_KEY: "re_test",
  RESEND_FROM: "test@test.com",
}));

vi.mock("@utils/env", () => ({ env: mockEnv }));
vi.mock("@utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), silly: vi.fn(), trace: vi.fn(), fatal: vi.fn() },
}));

// Mock token service
vi.mock("../../src/services/tokenService", () => ({
  TokenService: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue("mock-token-64-chars-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
    consume: vi.fn(),
  })),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth Services - Login", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    authServices = new AuthServices();
  });

  it("Must login successfully and return token", async () => {
    const fakeAdmin = {
      id: "mock-uuid-123",
      name: "Jorge Admin",
      email: "admin@studio.com",
      password: "hashed-password",
      role: "ADMIN",
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(jwt.sign).mockReturnValue("mock-jwt-token" as any);

    const response = await authServices.login({ email: "admin@studio.com", password: "senha123" });

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Login realizado com sucesso");
    expect(response.data.token).toBe("mock-jwt-token");
  });

  it("Must throw 401 when email is not found", async () => {
    vi.mocked(Admin.findOne).mockResolvedValue(null);
    vi.mocked(generateHashPassword).mockResolvedValue("dummy-hash");

    await expect(
      authServices.login({ email: "notfound@test.com", password: "senha123" }),
    ).rejects.toThrow();

    expect(compareHashPasswords).not.toHaveBeenCalled();
  });

  it("Must throw 401 when password is incorrect", async () => {
    const fakeAdmin = { id: "mock-uuid-123", email: "admin@studio.com", password: "hashed-password", role: "ADMIN" };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);

    await expect(
      authServices.login({ email: "admin@studio.com", password: "senha-errada" }),
    ).rejects.toThrow();

    expect(jwt.sign).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth Services - Setup", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    authServices = new AuthServices();
  });

  it("Must create OWNER and Academy on first setup", async () => {
    const fakeOwner = {
      id: "mock-owner-uuid",
      name: "Dono Studio",
      email: "dono@studio.com",
      password: "hashed-pass",
      isActive: true,
      role: "OWNER",
    };

    vi.mocked(Admin.count).mockResolvedValue(0);
    vi.mocked(generateHashPassword).mockResolvedValue("hashed-value");
    vi.mocked(Admin.create).mockResolvedValue(fakeOwner as any);
    vi.mocked(Academy.create).mockResolvedValue({} as any);
    vi.mocked(jwt.sign).mockReturnValue("mock-setup-token" as any);

    const response = await authServices.setup({
      academyName: "Studio Aerobic",
      name: "Dono Studio",
      email: "dono@studio.com",
      password: "Senha@123",
    });

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Sistema configurado com sucesso");
    expect(Admin.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "OWNER", isActive: true }),
    );
    expect(Academy.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Studio Aerobic" }),
    );
  });

  it("Must reject setup when admins already exist", async () => {
    vi.mocked(Admin.count).mockResolvedValue(1);

    await expect(
      authServices.setup({
        academyName: "Studio",
        name: "Outro",
        email: "outro@studio.com",
        password: "Senha@123",
      }),
    ).rejects.toThrow();

    expect(Admin.create).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GetSetupStatus
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth Services - GetSetupStatus", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    authServices = new AuthServices();
  });

  it("Must return setupCompleted: true when admins exist", async () => {
    vi.mocked(Admin.count).mockResolvedValue(1);

    const response = await authServices.getSetupStatus();

    expect(response.statusCode).toBe(200);
    expect(response.data.setupCompleted).toBe(true);
  });

  it("Must return setupCompleted: false when no admins exist", async () => {
    vi.mocked(Admin.count).mockResolvedValue(0);

    const response = await authServices.getSetupStatus();

    expect(response.statusCode).toBe(200);
    expect(response.data.setupCompleted).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ForgotPassword
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth Services - ForgotPassword", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    authServices = new AuthServices();
  });

  it("Must return 200 even when email is not found (anti-enumeration)", async () => {
    vi.mocked(Admin.findOne).mockResolvedValue(null);

    const response = await authServices.forgotPassword("noexist@test.com", "http://localhost:3333");

    expect(response.statusCode).toBe(200);
  });

  it("Must send email and return 200 when admin exists", async () => {
    const fakeAdmin = {
      id: "mock-uuid",
      name: "Jorge",
      email: "jorge@studio.com",
      isActive: true,
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);

    const response = await authServices.forgotPassword("jorge@studio.com", "http://localhost:3333");

    expect(response.statusCode).toBe(200);
  });
});
