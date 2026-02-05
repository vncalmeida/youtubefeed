import { post } from './api';

export async function registerAfterPayment(email: string, companyName: string, password: string) {
  const res = await post<{ ok: boolean }>('/api/auth/register-after-payment', { email, companyName, password });
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao registrar');
  }
  return res.data;
}
