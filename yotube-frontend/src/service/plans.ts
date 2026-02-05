import { get } from './api';
import type { PlanConfig } from '../types';

export async function getPlans(): Promise<PlanConfig[]> {
  const res = await get<{ plans: PlanConfig[] }>('/api/admin/settings');
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao buscar planos');
  }
  return res.data.plans;
}
