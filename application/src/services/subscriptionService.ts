import { Subscription } from "@models/subscription";
import { SubscriptionDTO } from "@dtos/subscription";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";
import { Student } from "@models/student";
import { Plan } from "@models/plan";

export class SubscriptionService {
  create = async (subscriptionData: Partial<SubscriptionDTO>) => {
    const existingSubscription = await Subscription.count({
      where: { studentId: subscriptionData.studentId, status: "ACTIVE" },
    });

    if (existingSubscription > 0)
      throw logger.error("Subscription already active", 409);

    const student = await Student.findByPk(subscriptionData.studentId);
    if (!student) throw logger.error("Student not found", 404);

    const plan = await Plan.findByPk(subscriptionData.planId);
    if (!plan) throw logger.error("Plan not found", 404);

    const createdSubscription = await Subscription.create(subscriptionData);

    return responseFormat({
      message: "Subscription created succesfully",
      statusCode: 201,
      data: createdSubscription,
    });
  };

  getAll = async () => {
    const subscriptions = await Subscription.findAll();

    if (subscriptions.length === 0)
      throw logger.error("Subscriptions not found", 404);

    return responseFormat({
      message: "Subscriptions found successfully",
      statusCode: 200,
      data: subscriptions,
    });
  };

  get = async (id: string) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw logger.error("Subscription not found", 404);

    return responseFormat({
      message: "Subscription found successfully",
      statusCode: 200,
      data: subscription,
    });
  };

  update = async (id: string, subscriptionData: Partial<SubscriptionDTO>) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw logger.error("Subscription not found", 404);

    if (subscriptionData.studentId) {
      const student = await Student.findByPk(subscriptionData.studentId);
      if (!student) throw logger.error("Student not found", 404);
    }

    if (subscriptionData.planId) {
      const plan = await Plan.findByPk(subscriptionData.planId);
      if (!plan) throw logger.error("Plan not found", 404);
    }
    
    const updatedSubscription = await subscription.update(subscriptionData);

    return responseFormat({
      message: "Subscription updated succesfully",
      statusCode: 200,
      data: updatedSubscription,
    });
  };

  delete = async (id: string) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw logger.error("Subscription not found", 404);

    await subscription.update({ status: "CANCELLED" });

    return responseFormat({
      message: "Subscription cancelled succesfully",
      statusCode: 200,
    });
  };
}
