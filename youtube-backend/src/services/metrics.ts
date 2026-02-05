import { MetricsRepository } from '../repositories/metrics.js';
import { Summary, RevenueByPlan, RevenueTrendItem } from '../types/metrics.js';

export class MetricsService {
  constructor(private repo = new MetricsRepository()) {}

  summary(): Promise<Summary> {
    return this.repo.summary();
  }

  revenueByPlan(): Promise<RevenueByPlan[]> {
    return this.repo.revenueByPlan();
  }

  revenueTrend(): Promise<RevenueTrendItem[]> {
    return this.repo.revenueTrend();
  }
}
