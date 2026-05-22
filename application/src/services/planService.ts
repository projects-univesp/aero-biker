import { Plan } from "@models/plan";
import { Subscription } from "@models/subscription";
import { PlanDTO } from "@dtos/plan";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

export class PlanService {
  create = async (planData: Partial<PlanDTO>) => {
    try {
      const existingPlan = await Plan.count({
        where: { name: planData.name },
      });

      if (existingPlan > 0) {
        return responseFormat.error("Plan Already exists", 409);
      }

      // Salva diretamente na tabela Plan com os dados validados pelo Zod
      const createdPlan = await Plan.create({
        name: planData.name,
        description: planData.description,
        price: planData.price,
        durationMonths: planData.durationMonths,
        isActive: planData.isActive ?? true,
      });

      return responseFormat.send({
        message: "Plan created successfully",
        statusCode: 201,
        data: createdPlan,
      });
    } catch (error) {
      logger.error(`${error}`);
      return responseFormat.error("Internal server error during plan creation", 500);
    }
  };

  getAll = async () => {
    try {
      const plans = await Plan.findAll();

      return responseFormat.send({
        message: "Plans found successfully",
        statusCode: 200,
        data: plans,
      });
    } catch (error) {
      logger.error(`${error}`);
      return responseFormat.error("Internal server error during plan retrieval", 500);
    }
  };

  get = async (id: string) => {
    try {
      const plan = await Plan.findByPk(id);

      if (plan === null) return responseFormat.error("Plan not found", 404);

      return responseFormat.send({
        message: "Plan found successfully",
        statusCode: 200,
        data: plan,
      });
    } catch (error) {
      logger.error(`${error}`);
      return responseFormat.error("Internal server error during plan retrieval", 500);
    }
  };

  update = async (id: string, planData: Partial<PlanDTO>) => {
    try {
      const plan = await Plan.findByPk(id);

      if (plan === null) {
        return responseFormat.error("Plan not found", 404);
      }

      if (planData.name && planData.name !== plan.name) {
        const existingPlan = await Plan.count({
          where: { name: planData.name },
        });

        if (existingPlan > 0) {
          return responseFormat.error("Plan Already exists", 409);
        }
      }

      // Atualiza os dados planos sem precisar de bulkCreate em tabelas filhas
      await plan.update({
        name: planData.name,
        description: planData.description,
        price: planData.price,
        durationMonths: planData.durationMonths,
        isActive: planData.isActive,
      });

      return responseFormat.send({
        message: "Plan updated successfully",
        statusCode: 200,
        data: plan,
      });
    } catch (error) {
      logger.error(`${error}`);
      return responseFormat.error("Internal server error during plan update", 500);
    }
  };

  delete = async (id: string) => {
    try {
      const plan = await Plan.findByPk(id);

      if (plan === null) return responseFormat.error("Plan not found", 404);

      // Busca diretamente pelo planId na tabela de assinaturas ativas
      const activeSubscriptions = await Subscription.count({
        where: { 
          planId: id,
          status: "ACTIVE" 
        },
      });

      if (activeSubscriptions > 0) {
        return responseFormat.error(
          "Cannot deactivate a plan with active subscriptions",
          400
        );
      }

      await plan.update({ isActive: false });

      return responseFormat.send({
        message: "Plan deactivated successfully",
        statusCode: 200,
      });
    } catch (error) {
      logger.error(`${error}`);
      return responseFormat.error("Internal server error during plan deletion", 500);
    }
  };
}