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
    const academy = await this.configService.getAcademy();

    return res.status(200).json({
      message: "Academia encontrada com sucesso",
      data: academy,
    });
  };

  updateAcademy = async (req: Request, res: Response) => {
    const parsed = this.data.verifyAcademy(req.body);
    const academy = await this.configService.updateAcademy(parsed);

    return res.status(200).json({
      message: "Academia atualizada com sucesso",
      data: academy,
    });
  };

  listAdmins = async (_req: Request, res: Response) => {
    const admins = await this.configService.listAdmins();

    return res.status(200).json({
      message: "Admins retrieved",
      data: admins,
    });
  };

  createAdmin = async (req: Request, res: Response) => {
    const parsed = this.data.verifyCreateAdmin(req.body);
    const admin = await this.configService.createAdmin(parsed);

    return res.status(201).json({
      message: "Usuário criado com sucesso",
      data: admin,
    });
  };

  changePassword = async (req: Request, res: Response) => {
    const parsed = this.data.verifyChangePassword(req.body);

    const result = await this.configService.changePassword(
      req.user!.id,
      parsed.currentPassword,
      parsed.newPassword,
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Senha alterada com sucesso",
    });
  };

  deactivateAdmin = async (req: Request, res: Response) => {
    const { id } = this.data.verifyId(req.params.id);
    const result = await this.configService.deactivateAdmin(id, req.user!.id);

    return res.status(200).json({
      message: "Usuário desativado com sucesso",
    });
  };

  reactivateAdmin = async (req: Request, res: Response) => {
    const { id } = this.data.verifyId(req.params.id);
    const result = await this.configService.reactivateAdmin(id);

    return res.status(200).json({
      message: "Usuário reativado com sucesso",
    });
  };
}
