import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.js';

export class MetricsController {
  private service = new MetricsService();

  summary = async (_req: Request, res: Response) => {
    const data = await this.service.summary();
    res.json(data);
  };

  revenueByPlan = async (_req: Request, res: Response) => {
    const data = await this.service.revenueByPlan();
    res.json(data);
  };

  revenueTrend = async (_req: Request, res: Response) => {
    const data = await this.service.revenueTrend();
    res.json(data);
  };
}
