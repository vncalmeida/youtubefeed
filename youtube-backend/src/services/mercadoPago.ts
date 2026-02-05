import 'dotenv/config';
import { PixPayment } from '../types/payment.js';
import crypto from 'crypto';

export class MercadoPagoService {
  private token: string;
  private baseUrl = 'https://api.mercadopago.com';
  private webhookSecret: string;

  constructor(token?: string, webhookSecret?: string) {
    const t = token || process.env.MP_ACCESS_TOKEN || '';
    if (!t) {
      throw new Error('MP_ACCESS_TOKEN is not set');
    }
    this.token = t;
    this.webhookSecret = webhookSecret || process.env.MP_WEBHOOK_SECRET || '';
  }

  async createPixPayment(amount: number, description: string, email: string): Promise<PixPayment> {
    const res = await fetch(`${this.baseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description,
        payment_method_id: 'pix',
        payer: { email },
      }),
    });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const err = await res.json();
        msg = err.message || err.error || msg;
      } catch {}
      throw new Error(`Failed to create payment: ${msg}`);
    }
    const data = await res.json();
    return {
      id: String(data.id),
      qrCode: data.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      status: data.status,
    };
  }

  async getPaymentStatus(id: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v1/payments/${id}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch payment: ${res.statusText}`);
    }
    const data = await res.json();
    return data.status;
  }

  verifySignature(payload: string, signatureHeader: string): boolean {
    if (!signatureHeader || !this.webhookSecret) return false;
    try {
      const parts = signatureHeader.split(',');
      const ts = parts[0].split('=')[1];
      const signature = parts[1].split('=')[1];
      const text = `${ts}.${payload}`;
      const hash = crypto.createHmac('sha256', this.webhookSecret).update(text).digest('hex');
      return hash === signature;
    } catch {
      return false;
    }
  }
}
