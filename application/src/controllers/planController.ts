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

  createPlan = async (req: Request, res: Response) => {
    try {
      const data = this.verifyData.verifyPlan(req.body);
      const plan = await this.planService.create(data);
      return res.status(201).json(plan);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  getAllPlans = async (_req: Request, res: Response) => {
    const plans = await this.planService.getAll();
    return res.status(200).json(plans);
  };

  getPlan = async (req: Request, res: Response) => {
    const { id } = this.verifyData.verifyId(req.params.id);
    const plan = await this.planService.getById(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    return res.status(200).json(plan);
  };

  updatePlan = async (req: Request, res: Response) => {
    try {
      const { id } = this.verifyData.verifyId(req.params.id);
      const data = this.verifyData.verifyUpdatePlan(req.body);

      const updated = await this.planService.update(id, data);

      if (!updated) {
        return res.status(404).json({ message: "Plan not found" });
      }

      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  deletePlan = async (req: Request, res: Response) => {
    const { id } = this.verifyData.verifyId(req.params.id);
    const result = await this.planService.remove(id);

    if (!result) {
      return res.status(404).json({ message: "Plan not found" });
    }

    return res.status(200).json(result);
  };
}