export interface SubscriptionDTO {
  studentId: string;
  planId: string;
  subscriptionValue: number;
  startDate: Date;
  renovationDate: Date;
  status: string;
  paymentMethod: string;
}
