import { describe, it, expect, vi, beforeEach } from "vitest";

import { AuthServices } from "../../src/services/authServices";
import { Admin } from "../../src/models/admin";
import { SystemConfig } from "../../src/models/systemConfig";
import { compareHashPasswords, generateHashPassword } from "../../src/utils/encrypt";
import jwt from "jsonwebtoken";

vi.mock("@models/admin");
vi.mock("@models/systemConfig");
vi.mock("@utils/encrypt");
vi.mock("jsonwebtoken");

// vi.hoisted runs before any imports, guaranteeing mockEnv is defined when
// the @utils/env factory is first called (logger.ts also imports env at module level).
const mockEnv = vi.hoisted(() => ({
  JWT_SECRET: "test-secret-key",
  JWT_EXPIRES_IN: 604800,
  MASTER_RECOVERY_KEY: "valid-recovery-key-abc123",
  NODE_ENV: "test",
  SALT_RESULT: 10,
}));

vi.mock("@utils/env", () => ({ env: mockEnv }));
vi.mock("@utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), silly: vi.fn(), trace: vi.fn(), fatal: vi.fn() },
}));

// ─────────────────────────────────────────────────────────────────────────────
// EmailLogin
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth Services - EmailLogin", () => {
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

    const response = await authServices.emailLogin({
      email: "admin@studio.com",
      password: "senha123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Login realizado com sucesso");
    expect(response.data.token).toBe("mock-jwt-token");
    expect(response.data.admin.id).toBe("mock-uuid-123");
  });

  it("Must throw a 401 error if email is not found", async () => {
    vi.mocked(Admin.findOne).mockResolvedValue(null);
    vi.mocked(generateHashPassword).mockResolvedValue("dummy-hash");

    await expect(
      authServices.emailLogin({ email: "notfound@test.com", password: "senha123" }),
    ).rejects.toThrow();

    expect(compareHashPasswords).not.toHaveBeenCalled();
  });

  it("Must throw a 401 error if password is incorrect", async () => {
    const fakeAdmin = {
      id: "mock-uuid-123",
      email: "admin@studio.com",
      password: "hashed-password",
      role: "ADMIN",
    };

    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);

    await expect(
      authServices.emailLogin({ email: "admin@studio.com", password: "senha-errada" }),
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

  it("Must create OWNER and SystemConfig on first setup", async () => {
    const fakeOwner = {
      id: "mock-owner-uuid",
      name: "Dono Studio",
      email: "dono@studio.com",
      password: "hashed-pass",
      isActive: true,
      role: "OWNER",
    };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(null);
    vi.mocked(Admin.count).mockResolvedValue(0);
    vi.mocked(generateHashPassword).mockResolvedValue("hashed-value");
    vi.mocked(Admin.create).mockResolvedValue(fakeOwner as any);
    vi.mocked(SystemConfig.create).mockResolvedValue({} as any);
    vi.mocked(jwt.sign).mockReturnValue("mock-setup-token" as any);

    const response = await authServices.setup({
      name: "Dono Studio",
      email: "dono@studio.com",
      password: "Senha@123",
      masterPassword: "MasterPass@456!Ab",
    });

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Sistema configurado com sucesso");
    expect(Admin.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "OWNER", isActive: true }),
    );
    expect(SystemConfig.create).toHaveBeenCalledWith(
      expect.objectContaining({ setupCompleted: true }),
    );
  });

  it("Must reject second setup attempt when setupCompleted is true", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue({ setupCompleted: true } as any);

    await expect(
      authServices.setup({
        name: "Outro",
        email: "outro@studio.com",
        password: "Senha@123",
        masterPassword: "MasterPass@456!Ab",
      }),
    ).rejects.toThrow();

    expect(Admin.create).not.toHaveBeenCalled();
    expect(SystemConfig.create).not.toHaveBeenCalled();
  });

  it("Must reject setup when admins already exist", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue(null);
    vi.mocked(Admin.count).mockResolvedValue(1);

    await expect(
      authServices.setup({
        name: "Qualquer",
        email: "q@studio.com",
        password: "Senha@123",
        masterPassword: "MasterPass@456!Ab",
      }),
    ).rejects.toThrow();

    expect(Admin.create).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth Services - Register", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    authServices = new AuthServices();
  });

  it("Must create a new user with valid master password", async () => {
    const fakeConfig = { setupCompleted: true, masterPasswordHash: "hashed-master" };
    const fakeNewUser = {
      id: "mock-user-uuid",
      name: "Novo Instrutor",
      email: "instrutor@studio.com",
      role: "USER",
    };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(fakeConfig as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(Admin.findOne).mockResolvedValue(null);
    vi.mocked(generateHashPassword).mockResolvedValue("hashed-user-pass");
    vi.mocked(Admin.create).mockResolvedValue(fakeNewUser as any);

    const response = await authServices.register({
      name: "Novo Instrutor",
      email: "instrutor@studio.com",
      password: "Senha@123",
      masterPassword: "MasterPass@456!Ab",
    });

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Usuário criado com sucesso");
    expect(response.data.id).toBe("mock-user-uuid");
    expect(Admin.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "USER", isActive: true }),
    );
  });

  it("Must throw 401 with invalid master password", async () => {
    const fakeConfig = { setupCompleted: true, masterPasswordHash: "hashed-master" };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(fakeConfig as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);

    await expect(
      authServices.register({
        name: "Alguem",
        email: "alguem@studio.com",
        password: "Senha@123",
        masterPassword: "MasterErrada",
      }),
    ).rejects.toThrow();

    expect(Admin.create).not.toHaveBeenCalled();
  });

  it("Must throw 409 when email is already registered", async () => {
    const fakeConfig = { setupCompleted: true, masterPasswordHash: "hashed-master" };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(fakeConfig as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(Admin.findOne).mockResolvedValue({ id: "existing-uuid" } as any);

    await expect(
      authServices.register({
        name: "Duplicado",
        email: "duplicado@studio.com",
        password: "Senha@123",
        masterPassword: "MasterPass@456!Ab",
      }),
    ).rejects.toThrow();

    expect(Admin.create).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ResetPasswordWithMaster
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth Services - ResetPasswordWithMaster", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    authServices = new AuthServices();
  });

  it("Must reset password successfully with valid master password", async () => {
    const fakeConfig = { setupCompleted: true, masterPasswordHash: "hashed-master" };
    const fakeAdmin = {
      id: "mock-uuid-123",
      email: "admin@studio.com",
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(fakeConfig as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(Admin.findOne).mockResolvedValue(fakeAdmin as any);
    vi.mocked(generateHashPassword).mockResolvedValue("new-hashed-pass");

    const response = await authServices.resetPasswordWithMaster({
      email: "admin@studio.com",
      masterPassword: "MasterPass@456!Ab",
      newPassword: "NovaSenha@789",
    });

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Senha redefinida com sucesso");
    expect(fakeAdmin.update).toHaveBeenCalledWith(
      expect.objectContaining({ password: "new-hashed-pass" }),
    );
  });

  it("Must throw 401 with invalid master password", async () => {
    const fakeConfig = { setupCompleted: true, masterPasswordHash: "hashed-master" };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(fakeConfig as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(false);
    vi.mocked(Admin.findOne).mockResolvedValue({ id: "x" } as any);

    await expect(
      authServices.resetPasswordWithMaster({
        email: "admin@studio.com",
        masterPassword: "MasterErrada",
        newPassword: "NovaSenha@789",
      }),
    ).rejects.toThrow();

    expect(generateHashPassword).not.toHaveBeenCalled();
  });

  it("Must throw 401 when email does not exist", async () => {
    const fakeConfig = { setupCompleted: true, masterPasswordHash: "hashed-master" };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(fakeConfig as any);
    vi.mocked(compareHashPasswords).mockResolvedValue(true);
    vi.mocked(Admin.findOne).mockResolvedValue(null);

    await expect(
      authServices.resetPasswordWithMaster({
        email: "inexistente@studio.com",
        masterPassword: "MasterPass@456!Ab",
        newPassword: "NovaSenha@789",
      }),
    ).rejects.toThrow();

    expect(generateHashPassword).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ResetMasterPassword
// ─────────────────────────────────────────────────────────────────────────────

describe("Auth Services - ResetMasterPassword", () => {
  let authServices: AuthServices;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.MASTER_RECOVERY_KEY = "valid-recovery-key-abc123";
    authServices = new AuthServices();
  });

  it("Must reset master password with valid recovery key", async () => {
    const fakeConfig = {
      masterPasswordHash: "old-master-hash",
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(fakeConfig as any);
    vi.mocked(generateHashPassword).mockResolvedValue("new-master-hash");

    const response = await authServices.resetMasterPassword({
      recoveryKey: "valid-recovery-key-abc123",
      newMasterPassword: "Nova@MasterKey#456Ab",
    });

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Senha mestre redefinida com sucesso");
    expect(fakeConfig.update).toHaveBeenCalledWith({ masterPasswordHash: "new-master-hash" });
  });

  it("Must throw 401 with invalid recovery key", async () => {
    const fakeConfig = {
      masterPasswordHash: "old-master-hash",
      update: vi.fn(),
    };

    vi.mocked(SystemConfig.findOne).mockResolvedValue(fakeConfig as any);

    await expect(
      authServices.resetMasterPassword({
        recoveryKey: "wrong-key",
        newMasterPassword: "Nova@MasterKey#456Ab",
      }),
    ).rejects.toThrow();

    expect(fakeConfig.update).not.toHaveBeenCalled();
  });

  it("Must throw 501 when recovery key is not configured on server", async () => {
    mockEnv.MASTER_RECOVERY_KEY = "";

    await expect(
      authServices.resetMasterPassword({
        recoveryKey: "qualquer-chave",
        newMasterPassword: "Nova@MasterKey#456Ab",
      }),
    ).rejects.toThrow();

    expect(SystemConfig.findOne).not.toHaveBeenCalled();
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

  it("Must return setupCompleted: true when system is configured", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue({ setupCompleted: true } as any);

    const response = await authServices.getSetupStatus();

    expect(response.statusCode).toBe(200);
    expect(response.data.setupCompleted).toBe(true);
  });

  it("Must return setupCompleted: false when no config exists", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue(null);

    const response = await authServices.getSetupStatus();

    expect(response.statusCode).toBe(200);
    expect(response.data.setupCompleted).toBe(false);
  });
});
