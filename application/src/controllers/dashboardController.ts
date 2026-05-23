import { Request, Response } from "express";
import { DashboardService } from "@services/dashboardService";

export class DashboardController {
  private readonly dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getDashboard = async (request: Request, response: Response) => {
    const dashboard = await this.dashboardService.getDashboard();

    return response.status(200).send(dashboard);
  };
}