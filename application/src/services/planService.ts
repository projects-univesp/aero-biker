import { sequelize } from "@config/database";
import { Plan } from "@models/plan";
import { PlanModality } from "@models/planModality";
import { Subscription } from "@models/subscription";
import { PlanDTO } from "@dtos/plan";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

export class PlanService {
  create = async (planData: Partial<PlanDTO>) => {
    // Inicia a transação para garantir que Plano e Preços sejam criados juntos
    const transaction = await sequelize.transaction();

    try {
      const existingPlan = await Plan.count({
        where: { name: planData.name },
        transaction,
      });

      if (existingPlan > 0) {
        await transaction.rollback();
        return responseFormat.error("Plan Already exists", 409);
      }

      // 1. Cria a entidade raiz (Plan)
      const createdPlan = await Plan.create(
        {
          name: planData.name,
          description: planData.description,
          isActive: planData.isActive ?? true,
        },
        { transaction },
      );

      // 2. Cria as modalidades de preço associadas
      if (planData.prices && planData.prices.length > 0) {
        const pricesToCreate = planData.prices.map((price) => ({
          ...price,
          planId: createdPlan.id,
        }));

        await PlanModality.bulkCreate(pricesToCreate, { transaction });
      }

      await transaction.commit();

      // Busca o plano recém-criado com os preços incluídos para retornar na resposta
      const planWithPrices = await Plan.findByPk(createdPlan.id, {
        include: [{ model: PlanModality, as: "prices" }],
      });

      return responseFormat.send({
        message: "Plan created successfully",
        statusCode: 201,
        data: planWithPrices,
      });
    } catch (error) {
      await transaction.rollback();
      logger.error(`${error}`);
      return responseFormat.error(
        "Internal server error during plan creation",
        500,
      );
    }
  };

  getAll = async () => {
    // Retorna todos os planos incluindo as suas modalidades de preço
    const plans = await Plan.findAll({
      include: [
        {
          model: PlanModality,
          as: "prices",
          where: { isActive: true }, // Opcional: trazer apenas modalidades ativas
          required: false, // LEFT JOIN: traz o plano mesmo se não tiver preços ativos
        },
      ],
    });

    return responseFormat.send({
      message: "Plans found successfully",
      statusCode: 200,
      data: plans,
    });
  };

  get = async (id: string) => {
    const plan = await Plan.findByPk(id, {
      include: [{ model: PlanModality, as: "prices" }],
    });

    if (plan === null) return responseFormat.error("Plan not found", 404);

    return responseFormat.send({
      message: "Plan found successfully",
      statusCode: 200,
      data: plan,
    });
  };

  update = async (id: string, planData: Partial<PlanDTO>) => {
    const transaction = await sequelize.transaction();

    try {
      const plan = await Plan.findByPk(id, { transaction });

      if (plan === null) {
        await transaction.rollback();
        return responseFormat.error("Plan not found", 404);
      }

      if (planData.name && planData.name !== plan.name) {
        const existingPlan = await Plan.count({
          where: { name: planData.name },
          transaction,
        });

        if (existingPlan > 0) {
          await transaction.rollback();
          return responseFormat.error("Plan Already exists", 409);
        }
      }

      // Atualiza os dados base do Plano
      await plan.update(
        {
          name: planData.name,
          description: planData.description,
          isActive: planData.isActive,
        },
        { transaction },
      );

      // Estratégia de atualização de preços:
      // Para não corromper o histórico de assinaturas antigas, desativamos os preços antigos e criamos os novos.
      if (planData.prices && planData.prices.length > 0) {
        await PlanModality.update(
          { isActive: false },
          { where: { planId: id }, transaction },
        );

        const newPrices = planData.prices.map((price) => ({
          ...price,
          planId: id,
        }));
        await PlanModality.bulkCreate(newPrices, { transaction });
      }

      await transaction.commit();

      const updatedPlan = await Plan.findByPk(id, {
        include: [{ model: PlanModality, as: "prices" }],
      });

      return responseFormat.send({
        message: "Plan updated successfully",
        statusCode: 200,
        data: updatedPlan,
      });
    } catch (error) {
      await transaction.rollback();
      logger.error(`${error}`);
      return responseFormat.error(
        "Internal server error during plan update",
        500,
      );
    }
  };

  toggleActive = async (id: string) => {
    const plan = await Plan.findByPk(id);
    if (plan === null) return responseFormat.error("Plan not found", 404);

    const newStatus = !plan.isActive;
    await plan.update({ isActive: newStatus });

    return responseFormat.send({
      message: newStatus
        ? "Plan activated successfully"
        : "Plan deactivated successfully",
      statusCode: 200,
    });
  };

  delete = async (id: string) => {
    const plan = await Plan.findByPk(id);
    if (plan === null) return responseFormat.error("Plan not found", 404);

    const linkedSubscriptions = await Subscription.count({
      include: [
        {
          model: PlanModality,
          as: "planModality",
          where: { planId: id },
        },
      ],
    });

    if (linkedSubscriptions > 0) {
      return responseFormat.error(
        "Cannot delete a plan that has subscriptions linked to it",
        400,
      );
    }

    await PlanModality.destroy({ where: { planId: id } });
    await plan.destroy();

    return responseFormat.send({
      message: "Plan deleted successfully",
      statusCode: 200,
    });
  };
}
