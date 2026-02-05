export interface Channel {
  id: number;
  name: string;
  avatar: string;
  subscriberCount: number;
  url: string;
  youtubeId: string;
  companyId: number;
  addedAt: string;
}

export interface ChannelCreateInput {
  name: string;
  avatar: string;
  subscriberCount: number;
  url: string;
  youtubeId: string;
}
