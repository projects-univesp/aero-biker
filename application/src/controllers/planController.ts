import { Request, Response } from "express";
import { PlanService } from "@services/planService";
import { VerifyData } from "@utils/zod";

export class PlanController {
  private readonly planService: PlanService;
  private readonly verifyData: VerifyData;

  constructor() {
    this.planService = new PlanService();
    this.verifyData = new VerifyData();
  }

  createPlan = async (request: Request, response: Response) => {
    const { price, durationMonths, ...base } = this.verifyData.verifyPlan(
      request.body,
    );
    const plan = await this.planService.create({
      ...base,
      prices: [{ price, durationMonths, isActive: true }],
    });
    return response.status(201).send(plan);
  };

  getPlan = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const plan = await this.planService.get(id);
    return response.status(200).send(plan);
  };

  getAllPlans = async (request: Request, response: Response) => {
    const plans = await this.planService.getAll();
    return response.status(200).send(plans);
  };

  updatePlan = async (request: Request, response: Response) => {
    const { price, durationMonths, ...base } =
      this.verifyData.verifyPlanPartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const planData: Record<string, unknown> = { ...base };
    if (price !== undefined && durationMonths !== undefined) {
      planData.prices = [{ price, durationMonths, isActive: true }];
    }
    const plan = await this.planService.update(id, planData);
    return response.status(200).send(plan);
  };

  togglePlan = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const plan = await this.planService.toggleActive(id);
    return response.status(200).send(plan);
  };

  deletePlan = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const plan = await this.planService.delete(id);
    return response.status(200).send(plan);
  };
}
