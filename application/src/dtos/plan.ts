export enum PLANS {
  MONTHLY = "Mensal",
  QUATERLY = "Trimestral",
  SEMESTER = "Semestral",
  YEARLY = "Anual"
}
  
export interface PlanDTO {
  name: string;
  description: string;
  price: number;
  durationMonths: PLANS;
  isActive: boolean;
}