import { ConfigService } from "@services/configService";
import { VerifyData } from "@utils/zod";
import type { Request, Response } from "express";

export class ConfigController {
  private readonly data: VerifyData;
  private readonly configService: ConfigService;

  constructor() {
    this.data = new VerifyData();
    this.configService = new ConfigService();
  }

  getAcademy = async (_req: Request, res: Response) => {
    const result = await this.configService.getAcademy();
    return res.status(200).json(result);
  };

  updateAcademy = async (req: Request, res: Response) => {
    const parsed = this.data.verifyAcademy(req.body);
    const result = await this.configService.updateAcademy(parsed);
    return res.status(200).json(result);
  };

  listAdmins = async (_req: Request, res: Response) => {
    const result = await this.configService.listAdmins();
    return res.status(200).json(result);
  };

  createAdmin = async (req: Request, res: Response) => {
    const parsed = this.data.verifyCreateAdmin(req.body);
    const result = await this.configService.createAdmin(parsed);
    return res.status(201).json(result);
  };

  changePassword = async (req: Request, res: Response) => {
    const parsed = this.data.verifyChangePassword(req.body);
    const result = await this.configService.changePassword(req.user!.id, parsed.currentPassword, parsed.newPassword);
    return res.status(200).json(result);
  };

  deactivateAdmin = async (req: Request, res: Response) => {
    const { id } = this.data.verifyId(req.params.id);
    const result = await this.configService.deactivateAdmin(id, req.user!.id);
    return res.status(200).json(result);
  };

  reactivateAdmin = async (req: Request, res: Response) => {
    const { id } = this.data.verifyId(req.params.id);
    const result = await this.configService.reactivateAdmin(id);
    return res.status(200).json(result);
  };
}
