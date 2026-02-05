export type Plan = 'Pro' | 'Business' | 'Enterprise';

export interface Company {
  id: number;
  name: string;
  plan: Plan;
  isActive: boolean;
  mrr: number;
  usersCount: number;
  planExpiresAt: string | null;
  createdAt: string;
}

export interface CompanyCreateInput {
  name: string;
  plan: Plan;
  isActive: boolean;
  mrr: number;
  planExpiresAt: string | null;
}

export interface CompanyUser {
  id: number;
  companyId: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
}

export interface CompanyUserCreateInput {
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  isActive: boolean;
}
