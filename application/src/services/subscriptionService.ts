import { Subscription } from "@models/subscription";
import { SubscriptionDTO } from "@dtos/subscription";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";
import { Student } from "@models/student";
import { Plan } from "@models/plan";
import { Op } from "sequelize";

export class SubscriptionService {
  create = async (subscriptionData: Partial<SubscriptionDTO>) => {
    const existingSubscription = await Subscription.count({
      where: { studentId: subscriptionData.studentId, status: { [Op.ne]: "CANCELLED" } },
    });

    if (existingSubscription > 0)
      throw new AppError("Subscription already active", 409);

    const student = await Student.findByPk(subscriptionData.studentId);
    if (!student || !student.isActive) throw new AppError("Student not found", 404);

    const plan = await Plan.findByPk(subscriptionData.planId);
    if (!plan  || !plan.isActive) throw new AppError("Plan not found", 404);

    const createdSubscription = await Subscription.create(subscriptionData);

    return createdSubscription;
  };

  getAll = async () => {
    const subscriptions = await Subscription.findAll();

    return subscriptions;
  };

  get = async (id: string) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw new AppError("Subscription not found", 404);

    return subscription;
  };

  update = async (id: string, subscriptionData: Partial<SubscriptionDTO>) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw new AppError("Subscription not found", 404);

    if (subscriptionData.studentId) {
      const student = await Student.findByPk(subscriptionData.studentId);
      if (!student || !student.isActive) throw new AppError("Student not found", 404);
    }

    if (subscriptionData.planId) {
      const plan = await Plan.findByPk(subscriptionData.planId);
      if (!plan) throw new AppError("Plan not found", 404);
    }

    const updatedSubscription = await subscription.update(subscriptionData);

    return updatedSubscription;
  };

  delete = async (id: string) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw new AppError("Subscription not found", 404);

    await subscription.update({ status: "CANCELLED" });
  };
}
