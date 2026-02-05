import { Request, Response } from 'express';
import { ChannelService } from '../services/channels.js';

export class ChannelController {
  private service = new ChannelService();

  private getCompanyId(req: Request, res: Response): number | null {
    const id = Number(req.header('x-company-id'));
    if (!id) {
      res.status(400).json({ error: 'x-company-id header required' });
      return null;
    }
    return id;
  }

  list = async (req: Request, res: Response) => {
    const companyId = this.getCompanyId(req, res);
    if (companyId === null) return;
    const channels = await this.service.listChannels(companyId);
    res.json(channels);
  };

  create = async (req: Request, res: Response) => {
    const companyId = this.getCompanyId(req, res);
    if (companyId === null) return;
    const { youtubeId } = req.body;
    if (!youtubeId) {
      return res.status(400).json({ error: 'youtubeId is required' });
    }
    try {
      const channel = await this.service.addChannel(youtubeId, companyId);
      res.status(201).json(channel);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  videos = async (req: Request, res: Response) => {
    const companyId = this.getCompanyId(req, res);
    if (companyId === null) return;
    try {
      const videos = await this.service.getRecentVideos(companyId, Number(req.params.id));
      res.json(videos);
    } catch (err: any) {
      if (err.message === 'Channel not found') {
        res.status(404).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch videos' });
      }
    }
  };

  delete = async (req: Request, res: Response) => {
    const companyId = this.getCompanyId(req, res);
    if (companyId === null) return;
    await this.service.removeChannel(Number(req.params.id), companyId);
    res.status(204).end();
  };
}
