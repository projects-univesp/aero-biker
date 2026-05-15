import { Plan } from "@models/plan";
import { PlanDTO } from "@dtos/plan";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";
import { Subscription } from "@models/subscription";

export class PlanService {
  create = async (planData: Partial<PlanDTO>) => {
    const existingPlan = await Plan.count({
      where: { name: planData.name },
    });

    if (existingPlan > 0) responseFormat.error("Plan Already exists", 409);

    const createdPlan = await Plan.create(planData);

    return responseFormat.send({
      message: "Plan created succesfully",
      statusCode: 201,
      data: createdPlan,
    });
  };

  getAll = async () => {
    const plans = await Plan.findAll();

    if (plans.length === 0) responseFormat.error("Plans not found", 404);

    return responseFormat.send({
      message: "Plans found successfully",
      statusCode: 200,
      data: plans,
    });
  };

  get = async (id: string) => {
    const plan = await Plan.findByPk(id);

    if (plan === null) responseFormat.error("Plan not found", 404);

    return responseFormat.send({
      message: "Plan found successfully",
      statusCode: 200,
      data: plan,
    });
  };

  update = async (id: string, planData: Partial<PlanDTO>) => {
    const plan = await Plan.findByPk(id);

    if (plan === null) responseFormat.error("Plan not found", 404);

    if (planData.name && planData.name !== plan.name) {
      const existingPlan = await Plan.count({
        where: { name: planData.name },
      });

      if (existingPlan > 0) responseFormat.error("Plan Already exists", 409);
    }

    const updatedPlan = await plan.update(planData);

    return responseFormat.send({
      message: "Plan updated succesfully",
      statusCode: 200,
      data: updatedPlan,
    });
  };

  delete = async (id: string) => {
    const plan = await Plan.findByPk(id);

    if (plan === null) responseFormat.error("Plan not found", 404);

    const activeSubscriptions = await Subscription.count({
      where: { planId: id, status: "ACTIVE" },
    });

    if (activeSubscriptions > 0) {
      responseFormat.error(
        "Cannot deactivate a plan with active subscriptions",
        400,
      );
    }

    await plan.update({ isActive: false });

    return responseFormat.send({
      message: "Plan deactivated succesfully",
      statusCode: 200,
    });
  };
}
