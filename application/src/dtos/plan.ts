export const PLANS = ["Mensal", "Trimestral", "Semestral", "Anual"] as const;

export type PlanDuration = typeof PLANS[number];

export interface PlanDTO {
  name: string;
  description: string;
  price: number;
  durationMonths: PlanDuration; 
  isActive: boolean;
}