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
      responseFormat.error("Subscription already active", 409);

    const student = await Student.findByPk(subscriptionData.studentId);
    if (!student || !student.isActive) responseFormat.error("Student not found", 404);

    const plan = await Plan.findByPk(subscriptionData.planId);
    if (!plan  || !plan.isActive) responseFormat.error("Plan not found", 404);

    const createdSubscription = await Subscription.create(subscriptionData);

    return responseFormat.send({
      message: "Subscription created succesfully",
      statusCode: 201,
      data: createdSubscription,
    });
  };

  getAll = async () => {
    const subscriptions = await Subscription.findAll();

    return responseFormat.send({
      message: "Subscriptions found successfully",
      statusCode: 200,
      data: subscriptions,
    });
  };

  get = async (id: string) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      responseFormat.error("Subscription not found", 404);

    return responseFormat.send({
      message: "Subscription found successfully",
      statusCode: 200,
      data: subscription,
    });
  };

  update = async (id: string, subscriptionData: Partial<SubscriptionDTO>) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      responseFormat.error("Subscription not found", 404);

    if (subscriptionData.studentId) {
      const student = await Student.findByPk(subscriptionData.studentId);
      if (!student || !student.isActive) responseFormat.error("Student not found", 404);
    }

    if (subscriptionData.planId) {
      const plan = await Plan.findByPk(subscriptionData.planId);
      if (!plan) responseFormat.error("Plan not found", 404);
    }

    const updatedSubscription = await subscription.update(subscriptionData);

    return responseFormat.send({
      message: "Subscription updated succesfully",
      statusCode: 200,
      data: updatedSubscription,
    });
  };

  delete = async (id: string) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      responseFormat.error("Subscription not found", 404);

    await subscription.update({ status: "CANCELLED" });

    return responseFormat.send({
      message: "Subscription cancelled succesfully",
      statusCode: 200,
    });
  };
}
