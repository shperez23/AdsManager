export interface AdSet {
  id: string;
  accountId: string;
  name: string;
  status: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  bidAmount?: number;
  optimizationGoal?: string;
  billingEvent?: string;
  targeting?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
