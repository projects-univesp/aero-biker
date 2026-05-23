import { Request, Response } from "express";
import { SettingsService } from "@services/settingsService";
import { z } from "zod";

export class SettingsController {
  private readonly settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  getPlanPrices = async (_req: Request, res: Response) => {
    const result = await this.settingsService.getPlanPrices();
    return res.status(200).send(result);
  };

  savePlanPrices = async (req: Request, res: Response) => {
    const schema = z.object({
      Mensal: z.number().positive().optional(),
      Trimestral: z.number().positive().optional(),
      Semestral: z.number().positive().optional(),
      Anual: z.number().positive().optional(),
    });

    const prices = schema.parse(req.body);
    const result = await this.settingsService.savePlanPrices(prices);
    return res.status(200).send(result);
  };

  getCredentials = async (_req: Request, res: Response) => {
    const result = await this.settingsService.getCredentials();
    return res.status(200).send(result);
  };

  saveCredentials = async (req: Request, res: Response) => {
    const schema = z.object({
      name: z.string().min(1).max(50).optional(),
      newPassword: z.string().min(6).max(72).optional(),
      oldPassword: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await this.settingsService.saveCredentials(data);
    return res.status(200).send(result);
  };
}
