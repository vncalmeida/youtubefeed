import { ChannelRepository } from '../repositories/channels.js';
import { YouTubeService } from './youtube.js';
import { Channel } from '../types/channel.js';
import type { Video } from './youtube.js';

export class ChannelService {
  private repo: ChannelRepository;
  private youtube: YouTubeService;

  constructor(repo = new ChannelRepository(), youtube = new YouTubeService()) {
    this.repo = repo;
    this.youtube = youtube;
  }

  async listChannels(companyId: number): Promise<Channel[]> {
    return this.repo.findAll(companyId);
  }

  async addChannel(youtubeId: string, companyId: number): Promise<Channel> {
    const meta = await this.youtube.fetchChannel(youtubeId);
    return this.repo.create(meta, companyId);
  }

  async getRecentVideos(companyId: number, id: number): Promise<Video[]> {
    const channel = await this.repo.findById(id, companyId);
    if (!channel) {
      throw new Error('Channel not found');
    }
    return this.youtube.fetchRecentVideos(channel.youtubeId);
  }

  async removeChannel(id: number, companyId: number): Promise<void> {
    await this.repo.delete(id, companyId);
  }
}
