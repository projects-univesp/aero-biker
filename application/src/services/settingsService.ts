import { Admin } from "@models/admin";
import { SystemConfig } from "@models/systemConfig";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { responseFormat } from "@utils/responseFormat";

const DURATIONS = ["Mensal", "Trimestral", "Semestral", "Anual"] as const;
type Duration = (typeof DURATIONS)[number];
type PlanPrices = Record<Duration, number>;

const DEFAULT_PRICES: PlanPrices = {
  Mensal: 130,
  Trimestral: 170,
  Semestral: 150,
  Anual: 130,
};

export class SettingsService {
  getPlanPrices = async () => {
    const rows = await SystemConfig.findAll({
      where: { key: DURATIONS as unknown as string[] },
    });

    const prices: PlanPrices = { ...DEFAULT_PRICES };
    for (const row of rows) {
      const k = row.key as Duration;
      if (DURATIONS.includes(k)) {
        prices[k] = Number(row.value);
      }
    }

    return responseFormat.send({
      message: "Plan prices retrieved successfully",
      statusCode: 200,
      data: prices,
    });
  };

  savePlanPrices = async (prices: Partial<PlanPrices>) => {
    for (const key of DURATIONS) {
      const val = prices[key];
      if (val != null && val > 0) {
        await SystemConfig.upsert({ key, value: String(val) });
      }
    }

    return this.getPlanPrices();
  };

  getCredentials = async () => {
    const admin = await Admin.findOne();
    if (!admin) responseFormat.error("No admin found", 404);

    return responseFormat.send({
      message: "Credentials retrieved successfully",
      statusCode: 200,
      data: { name: admin.name, email: admin.email },
    });
  };

  saveCredentials = async (data: { name?: string; newPassword?: string; oldPassword?: string }) => {
    const admin = await Admin.findOne();
    if (!admin) responseFormat.error("No admin found", 404);

    const update: Record<string, string> = {};

    if (data.name?.trim()) {
      update.name = data.name.trim();
    }

    if (data.newPassword) {
      if (!data.oldPassword) {
        responseFormat.error("Senha atual é obrigatória para alterar a senha", 400);
      }
      const valid = await compareHashPasswords(data.oldPassword!, admin.password);
      if (!valid) {
        responseFormat.error("Senha atual incorreta", 401);
      }
      if (data.newPassword.length < 6) {
        responseFormat.error("Nova senha deve ter no mínimo 6 caracteres", 400);
      }
      update.password = await generateHashPassword(data.newPassword);
    }

    if (Object.keys(update).length === 0) {
      responseFormat.error("Nenhuma alteração enviada", 400);
    }

    await admin.update(update);

    return responseFormat.send({
      message: "Credenciais atualizadas com sucesso",
      statusCode: 200,
      data: { name: admin.name, email: admin.email },
    });
  };
}
