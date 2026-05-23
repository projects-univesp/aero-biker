// application/src/dtos/plan.ts

export enum PLANS {
  MONTHLY = "Mensal",
  QUATERLY = "Trimestral",
  SEMESTER = "Semestral",
  YEARLY = "Anual",
}

export interface PlanModalityDTO {
  price: number;
  durationMonths: PLANS;
  isActive?: boolean;
}

export interface PlanDTO {
  name: string;
  description: string;
  isActive: boolean;
  prices: PlanModalityDTO[];
}
