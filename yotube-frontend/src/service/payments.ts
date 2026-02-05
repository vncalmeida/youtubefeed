import { get, post } from './api';
import type { PixPayment, PixPaymentStatus } from '../types';

export async function createPixPayment(amount: number, description: string, email: string, metadata?: any): Promise<PixPayment> {
  const res = await post<PixPayment>('/api/payments/pix', { amount, description, email, metadata });
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao criar pagamento');
  }
  return res.data;
}

export async function getPixPaymentStatus(id: string): Promise<PixPaymentStatus> {
  const res = await get<PixPaymentStatus>(`/api/payments/${id}`);
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao consultar pagamento');
  }
  return res.data;
}
