import { Request, Response } from "express";
import { SubscriptionService } from "@services/subscriptionService";
import { VerifyData } from "@utils/zod";

export class SubscriptionController {
  private readonly subscriptionService: SubscriptionService;
  private readonly verifyData: VerifyData;

  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.verifyData = new VerifyData();
  }

  createSubscription = async (request: Request, response: Response) => {
    const parsedSubscription = this.verifyData.verifySubscription(request.body);
    const subscription =
      await this.subscriptionService.create(parsedSubscription);

    return response.status(201).send({
      message: "Subscription created succesfully",
      data: subscription,
    });
  };

  getSubscription = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const subscription = await this.subscriptionService.get(id);

    return response.status(200).send({
      message: "Subscription found succesfully",
      data: subscription,
    });
  };

  getAllSubscriptions = async (request: Request, response: Response) => {
    const subscriptions = await this.subscriptionService.getAll();

    return response.status(200).send({
      message: "Subscriptions found succesfully",
      data: subscriptions,
    });
  };

  updateSubscription = async (request: Request, response: Response) => {
    const parsedSubscription = this.verifyData.verifySubscriptionPartial(
      request.body,
    );
    const { id } = this.verifyData.verifyId(request.params.id);
    const subscription = await this.subscriptionService.update(
      id,
      parsedSubscription,
    );

    return response.status(200).send({
      message: "Subscription updated succesfully",
      data: subscription,
    });
  };

  deleteSubscription = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    await this.subscriptionService.delete(id);

    return response.status(200).send({
      message: "Subscription deactivated succesfully",
    });
  };
}
