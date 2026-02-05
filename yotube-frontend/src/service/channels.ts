import { get, post, del } from './api';
import type { Channel } from '../types';

export async function getChannels(): Promise<Channel[]> {
  const res = await get<Channel[]>('/channels');
  if (!res.ok || !res.data) {
    throw new Error(res.message || 'Erro ao buscar canais');
  }
  return res.data;
}

export async function addChannel(channel: Omit<Channel, 'id'>): Promise<void> {
  const res = await post<Channel>('/channels', channel);
  if (!res.ok) {
    throw new Error(res.message || 'Erro ao adicionar canal');
  }
}

export async function deleteChannel(channelId: string): Promise<void> {
  const res = await del<void>(`/channels/${channelId}`);
  if (!res.ok) {
    throw new Error(res.message || 'Erro ao remover canal');
  }
}
