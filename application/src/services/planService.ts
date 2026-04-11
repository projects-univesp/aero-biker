import { randomUUID } from "crypto";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CreatePlanDTO = Omit<
  Plan,
  "id" | "isActive" | "createdAt" | "updatedAt"
>;

type UpdatePlanDTO = Partial<CreatePlanDTO>;

const plans: Plan[] = [];

export class PlanService {
  async create(data: CreatePlanDTO) {
    const exists = plans.find(
      (p) => p.name.toLowerCase() === data.name.toLowerCase()
    );

    if (exists) {
      throw new Error("Plan already exists");
    }

    const newPlan: Plan = {
      id: randomUUID(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };

    plans.push(newPlan);
    return newPlan;
  }

  async getAll() {
    return plans.filter((p) => p.isActive);
  }

  async getById(id: string) {
    const plan = plans.find((p) => p.id === id && p.isActive);
    return plan || null;
  }

  async update(id: string, data: UpdatePlanDTO) {
    const plan = plans.find((p) => p.id === id && p.isActive);
    if (!plan) return null;

    if (data.name) {
      const name = data.name.toLowerCase();

      const exists = plans.find(
        (p) =>
          p.name.toLowerCase() === name &&
          p.id !== id
      );

      if (exists) {
        throw new Error("Plan already exists");
      }
    }

    Object.assign(plan, data, {
      updatedAt: new Date(),
    });

    return plan;
  }

  async remove(id: string) {
    const plan = plans.find((p) => p.id === id && p.isActive);
    if (!plan) return null;

    plan.isActive = false;
    plan.updatedAt = new Date();

    return plan;
  }
}