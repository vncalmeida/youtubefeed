import { pool } from '../db.js';
import { Summary, RevenueByPlan, RevenueTrendItem } from '../types/metrics.js';

export class MetricsRepository {
  async summary(): Promise<Summary> {
    const [rows] = await pool.query('SELECT plan, mrr FROM companies WHERE is_active = 1');
    const data = rows as any[];
    let totalRevenue = 0;
    const planMap = new Map<string, { revenue: number; sales: number }>();
    for (const r of data) {
      const mrr = Number(r.mrr) || 0;
      totalRevenue += mrr;
      const plan = r.plan as string;
      const p = planMap.get(plan) || { revenue: 0, sales: 0 };
      p.revenue += mrr;
      p.sales += 1;
      planMap.set(plan, p);
    }
    const topPlans = Array.from(planMap.entries()).map(([name, v]) => ({ name, revenue: v.revenue, sales: v.sales }));
    const activeSubs = data.length;
    const mrr = totalRevenue;
    const arr = mrr * 12;
    const avgTicket = activeSubs ? totalRevenue / activeSubs : 0;
    const churnRate = 0;
    return { totalRevenue, mrr, arr, avgTicket, activeSubs, churnRate, topPlans };
  }

  async revenueByPlan(): Promise<RevenueByPlan[]> {
    const [rows] = await pool.query(
      'SELECT plan, SUM(mrr) as revenue FROM companies WHERE is_active = 1 GROUP BY plan'
    );
    const data = rows as any[];
    return data.map(r => ({ plan: r.plan as string, revenue: Number(r.revenue) || 0 }));
  }

  async revenueTrend(): Promise<RevenueTrendItem[]> {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as revenue
       FROM payments
       WHERE status = 'approved'
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`
    );
    const data = rows as any[];
    return data
      .map(r => ({ month: r.month as string, revenue: Number(r.revenue) || 0 }))
      .reverse()
      .map(r => ({ ...r, mrr: r.revenue }));
  }
}
