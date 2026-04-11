export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}