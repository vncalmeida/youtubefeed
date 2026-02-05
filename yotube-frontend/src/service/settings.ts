import { get, put, post } from './api';
import type { PlanConfig, SmtpConfig, MpConfig } from '../types';

export async function getSettings(): Promise<{ plans: PlanConfig[]; smtp: SmtpConfig | null; mp: MpConfig | null }> {
  const res = await get<{ plans: PlanConfig[]; smtp: SmtpConfig | null; mp: MpConfig | null }>('/api/admin/settings');
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao buscar configurações');
  }
  return res.data;
}

export async function savePlans(plans: PlanConfig[]): Promise<void> {
  const res = await put<{ success: boolean }>('/api/admin/settings/plans', { plans });
  if (!res.ok) {
    throw new Error(res.message || 'Erro ao salvar planos');
  }
}

export async function saveSmtp(smtp: SmtpConfig): Promise<void> {
  const res = await put<{ success: boolean }>('/api/admin/settings/smtp', { smtp });
  if (!res.ok) {
    throw new Error(res.message || 'Erro ao salvar SMTP');
  }
}

export async function saveMp(mp: MpConfig): Promise<void> {
  const res = await put<{ success: boolean }>('/api/admin/settings/mp', { mp });
  if (!res.ok) {
    throw new Error(res.message || 'Erro ao salvar Mercado Pago');
  }
}

export async function testSmtp(to: string): Promise<{ success: boolean; message?: string }> {
  const res = await post<{ success: boolean; message?: string }>('/api/admin/settings/smtp/test', { to });
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao enviar teste');
  }
  return res.data;
}
