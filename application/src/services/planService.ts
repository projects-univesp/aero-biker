import { Plan } from "@models/plan";
import { Subscription } from "@models/subscription";
import { PlanDTO } from "@dtos/plan";
import { AppError } from "@utils/appError";

export class PlanService {
  create = async (planData: Partial<PlanDTO>) => {
    const existingPlan = await Plan.count({
      where: { name: planData.name },
    });

    if (existingPlan > 0) throw new AppError("Plan Already exists", 409);

    const createdPlan = await Plan.create({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      durationMonths: planData.durationMonths,
      isActive: planData.isActive ?? true,
    });

    return createdPlan;
  };

  getAll = async () => {
    const plans = await Plan.findAll();
    return plans;
  };

  get = async (id: string) => {
    const plan = await Plan.findByPk(id);

    if (plan === null) throw new AppError("Plan not found", 404);
    
    return plan;
  };

  update = async (id: string, planData: Partial<PlanDTO>) => {
    const plan = await Plan.findByPk(id);

    if (plan === null) throw new AppError("Plan not found", 404);

    if (planData.name && planData.name !== plan.name) {
      const existingPlan = await Plan.count({
        where: { name: planData.name },
      });

      if (existingPlan > 0) throw new AppError("Plan Already exists", 409);
    }

    await plan.update({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      durationMonths: planData.durationMonths,
      isActive: planData.isActive,
    });

    return plan;
  };

  delete = async (id: string) => {
    const plan = await Plan.findByPk(id);
    if (plan === null) throw new AppError("Plan not found", 404);

    const activeSubscriptions = await Subscription.count({
      where: { planId: id, status: "ACTIVE" },
    });

    if (activeSubscriptions > 0) throw new AppError("Cannot deactivate a plan with active subscriptions", 400);

    await plan.update({ isActive: false });
  };
}