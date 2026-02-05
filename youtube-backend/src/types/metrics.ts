export type PlanShare = { name: string; revenue: number; sales: number };

export interface Summary {
  totalRevenue: number;
  mrr: number;
  arr: number;
  avgTicket: number;
  activeSubs: number;
  churnRate: number;
  topPlans: PlanShare[];
}

export interface RevenueByPlan {
  plan: string;
  revenue: number;
}

export interface RevenueTrendItem {
  month: string;
  revenue: number;
  mrr: number;
}
