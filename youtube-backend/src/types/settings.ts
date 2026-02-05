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
