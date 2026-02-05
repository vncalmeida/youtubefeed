import { Request, Response } from 'express';
import { MercadoPagoService } from '../services/mercadoPago.js';
import { SettingsService } from '../services/settings.js';
import { BillingService } from '../services/billing.js';
import { SubscriptionRepository } from '../repositories/subscriptions.js';
import { CompanyRepository } from '../repositories/companies.js';
import { PaymentRepository } from '../repositories/payments.js';
import { UserRepository } from '../repositories/users.js';
import { paymentEvents } from '../services/paymentEvents.js';

export class PaymentsController {
  private settings = new SettingsService();
  private billing = new BillingService();
  private subscriptions = new SubscriptionRepository();
  private companies = new CompanyRepository();
  private payments = new PaymentRepository();
  private users = new UserRepository();

  createPix = async (req: Request, res: Response) => {
    const { amount, description, email, metadata } = req.body;
    if (typeof amount !== 'number' || !description || !email) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      const mp = await this.settings.getMp();
      if (!mp) throw new Error('Mercado Pago não configurado');
      const service = new MercadoPagoService(mp.accessToken, mp.webhookSecret);
      const payment = await service.createPixPayment(amount, description, email);
      await this.payments.create({ id: payment.id, amount, description, email, status: payment.status, metadata });
      res.json(payment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  subscribe = async (req: Request, res: Response) => {
    const { planId, email, companyName } = req.body;
    if (!planId || !email || !companyName) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      const mpCfg = await this.settings.getMp();
      if (!mpCfg) throw new Error('Mercado Pago não configurado');
      const { companyId, plan } = await this.billing.prepareSubscription(planId, email, companyName);
      const mp = new MercadoPagoService(mpCfg.accessToken, mpCfg.webhookSecret);
      const payment = await mp.createPixPayment(plan.price, plan.name, email);
      if (companyId) {
        await this.subscriptions.create({ paymentId: payment.id, companyId, planId, status: payment.status });
      }
      await this.payments.create({ id: payment.id, amount: plan.price, description: plan.name, email, status: payment.status, metadata: { companyId, planId } });
      res.json(payment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  status = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const mp = await this.settings.getMp();
      if (!mp) throw new Error('Mercado Pago não configurado');
      const service = new MercadoPagoService(mp.accessToken, mp.webhookSecret);
      const status = await service.getPaymentStatus(id);
      await this.payments.updateStatus(id, status);
      paymentEvents.emitStatus(id, status);
      let emailExists: boolean | undefined;
      if (status === 'approved') {
        const payment = await this.payments.findById(id);
        if (payment) {
          const user = await this.users.findByEmail(payment.email);
          emailExists = !!user;
        }
      }
      res.json({ id, status, emailExists });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  stream = (req: Request, res: Response) => {
    const { id } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(':ok\n\n');
    const listener = (e: { id: string; status: string }) => {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    };
    paymentEvents.onStatus(id, listener);
    req.on('close', () => {
      paymentEvents.offStatus(id, listener);
    });
  };

  webhook = async (req: Request, res: Response) => {
    try {
      const mp = await this.settings.getMp();
      if (!mp) throw new Error('Mercado Pago não configurado');
      const service = new MercadoPagoService(mp.accessToken, mp.webhookSecret);
      const signature = req.headers['x-signature'] as string;
      const payload = JSON.stringify(req.body || {});
      const valid = service.verifySignature(payload, signature);
      if (!valid) {
        return res.status(401).end();
      }
      const paymentId = req.body.data?.id;
      if (paymentId) {
        const subscription = await this.subscriptions.findByPaymentId(paymentId);
        const status = await service.getPaymentStatus(paymentId);
        if (subscription) {
          if (status === 'approved') {
            await this.subscriptions.updateStatus(paymentId, 'approved');
            const { plans } = await this.settings.getAll();
            const plan = plans.find(p => p.id === subscription.planId);
            if (plan) {
              const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              await this.companies.updatePlan(subscription.companyId, subscription.planId, plan.price, expiresAt);
              // TODO: enviar e-mail de boas-vindas caso usuário tenha sido criado automaticamente
            }
          }
        }
        await this.payments.updateStatus(paymentId, status);
        paymentEvents.emitStatus(paymentId, status);
        console.log('Mercado Pago webhook', req.body.type, paymentId, status);
      }
      res.sendStatus(200);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
}
