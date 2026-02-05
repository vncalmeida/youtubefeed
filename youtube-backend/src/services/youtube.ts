import 'dotenv/config';

export interface ChannelMetadata {
  name: string;
  avatar: string;
  subscriberCount: number;
  url: string;
  youtubeId: string;
}

export interface Video {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  url: string;
}

export class YouTubeService {
  private apiKey: string;

  constructor(apiKey = process.env.YOUTUBE_API_KEY || '') {
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  async fetchChannel(youtubeId: string): Promise<ChannelMetadata> {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${youtubeId}&key=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('Channel not found');
    }
    const item = data.items[0];
    return {
      name: item.snippet.title,
      avatar: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      subscriberCount: Number(item.statistics?.subscriberCount || 0),
      url: `https://www.youtube.com/channel/${item.id}`,
      youtubeId: item.id,
    };
  }

  async fetchRecentVideos(channelId: string): Promise<Video[]> {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${this.apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) {
      return [];
    }
    return data.items
      .filter((item: any) => item.id.kind === 'youtube#video')
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
  }
}
