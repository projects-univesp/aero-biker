import { AdminServices } from "@services/adminServices";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class AdminController {
  private readonly verifyData: VerifyData;
  private readonly adminServices: AdminServices;

  constructor() {
    this.verifyData = new VerifyData();
    this.adminServices = new AdminServices();
  }

  getAdmin = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const admin = await this.adminServices.get(id);
    return response.status(200).send(admin);
  };

  updateAdmin = async (request: Request, response: Response) => {
    const parsedAdmin = this.verifyData.verifyAdminPartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const admin = await this.adminServices.update(id, parsedAdmin);
    return response.status(200).send(admin);
  };

  deleteAdmin = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const admin = await this.adminServices.delete(id);
    return response.status(200).send(admin);
  };
}
