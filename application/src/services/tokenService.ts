import { sequelize } from "@config/database";
import { PasswordReset } from "@models/passwordReset";
import type { UUID } from "crypto";
import { createHash, randomBytes } from "crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export class TokenService {
  generate(): string {
    return randomBytes(32).toString("hex");
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async create(adminId: UUID): Promise<string> {
    const token = this.generate();
    const tokenHash = this.hash(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await sequelize.transaction(async (t) => {
      await PasswordReset.destroy({ where: { adminId }, transaction: t });
      await PasswordReset.create({ adminId, tokenHash, expiresAt }, { transaction: t });
    });

    return token;
  }

  async consume(
    token: string,
  ): Promise<{ adminId: UUID } | null> {
    const tokenHash = this.hash(token);
    const record = await PasswordReset.findOne({ where: { tokenHash } });

    if (!record) return null;
    if (record.usedAt) return null;
    if (new Date() > record.expiresAt) return null;

    await record.update({ usedAt: new Date() });

    return { adminId: record.adminId };
  }
}
