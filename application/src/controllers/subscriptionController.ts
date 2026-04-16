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
    const subscription = await this.subscriptionService.create(parsedSubscription);
    return response.status(201).send(subscription);
  };

  getSubscription = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const subscription = await this.subscriptionService.get(id);
    return response.status(200).send(subscription);
  };

  getAllSubscriptions = async (request: Request, response: Response) => {
    const subscriptions = await this.subscriptionService.getAll();
    return response.status(200).send(subscriptions);
  };

  updateSubscription = async (request: Request, response: Response) => {
    const parsedSubscription = this.verifyData.verifySubscription(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const subscription = await this.subscriptionService.update(id, parsedSubscription);
    return response.status(200).send(subscription);
  };

  deleteSubscription = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const subscription = await this.subscriptionService.delete(id);
    return response.status(200).send(subscription);
  };
}
