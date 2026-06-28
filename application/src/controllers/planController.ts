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
    const parsedPlan = this.verifyData.verifyPlan(request.body);
    const plan = await this.planService.create(parsedPlan);

    return response
      .status(201)
      .json({ message: "Plan created successfully", data: plan });
  };

  getPlan = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const plan = await this.planService.get(id);

    return response
      .status(200)
      .json({ message: "Plan found successfully", data: plan });
  };

  getAllPlans = async (request: Request, response: Response) => {
    const plans = await this.planService.getAll();

    return response
      .status(200)
      .json({ message: "Plans found successfully", data: plans });
  };

  updatePlan = async (request: Request, response: Response) => {
    const parsedPlan = this.verifyData.verifyPlanPartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const plan = await this.planService.update(id, parsedPlan);

    return response
      .status(200)
      .json({ message: "Plan updated successfully", data: plan});
  };

  deletePlan = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    await this.planService.delete(id);

    return response
      .status(200)
      .json({ message: "Plan deactivated successfully" });
  };
}
