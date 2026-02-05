import { UserRepository } from '../repositories/users.js';
import { SettingsRepository } from '../repositories/settings.js';
import { PlanConfig } from '../types/settings.js';

export class BillingService {
  private users: UserRepository;
  private settings: SettingsRepository;

  constructor(users = new UserRepository(), settings = new SettingsRepository()) {
    this.users = users;
    this.settings = settings;
  }

  async prepareSubscription(
    planId: string,
    email: string,
    companyName: string
  ): Promise<{ companyId?: number; plan: PlanConfig }> {
    const plans = await this.settings.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plano inválido');
    }

    const user = await this.users.findByEmail(email);
    if (user) {
      return { companyId: user.companyId, plan };
    }

    return { plan };
  }
}
