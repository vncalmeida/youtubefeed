// types.ts
export interface Channel {
  id: string;
  name: string;
  avatar: string;
  subscriberCount: number;
  url: string;
  youtubeId: string;
  addedAt: string;
}

export interface Video {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  performance: 'high' | 'medium' | 'low';
  sentimentScore: number;
  engagementRate: number;
  performanceScore: number;
  metrics: {
    ageInHours: number;
    viewsPerHour: number;
    engagementRate: number;
  };
}

export interface VideoMetrics {
  viewsGrowth: number[];
  likesGrowth: number[];
  commentsGrowth: number[];
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export type PlanShare = { name: string; revenue: number; sales: number };

export interface Summary {
  totalRevenue: number;
  mrr: number;
  arr: number;
  avgTicket: number;
  activeSubs: number;
  churnRate: number; // 0-1
  topPlans: PlanShare[];
}

export interface RevenueByPlan {
  plan: string;
  revenue: number;
}

export interface RevenueTrendItem {
  month: string;
  revenue: number;
  mrr: number;
}

export type Plan = 'Pro' | 'Business' | 'Enterprise';

export interface Company {
  id: number;
  name: string;
  plan: Plan;
  mrr: number;
  usersCount: number;
  planExpiresAt: string | null;
  createdAt: string; // ISO
}

export interface CompanyUser {
  id: number;
  companyId: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
}

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  channels: number;
  active: boolean;
  popular?: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

export interface MpConfig {
  accessToken: string;
  webhookSecret: string;
}

export interface PixPayment {
  id: string;
  qrCode: string;
  qrCodeBase64: string;
  status: string;
  expiresAt?: string;
}

export interface PixPaymentStatus {
  status: string;
  errorMessage?: string;
  emailExists?: boolean;
}
