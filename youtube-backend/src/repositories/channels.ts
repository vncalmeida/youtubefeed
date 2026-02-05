import { pool } from '../db.js';
import { Channel, ChannelCreateInput } from '../types/channel.js';

export class ChannelRepository {
  async findAll(companyId: number): Promise<Channel[]> {
    const [rows] = await pool.query('SELECT * FROM channels WHERE company_id = ?', [companyId]);
    return (rows as any[]).map(this.mapRow);
  }

  async findById(id: number, companyId: number): Promise<Channel | null> {
    const [rows] = await pool.query('SELECT * FROM channels WHERE id = ? AND company_id = ?', [id, companyId]);
    const row = (rows as any[])[0];
    return row ? this.mapRow(row) : null;
  }

  async create(input: ChannelCreateInput, companyId: number): Promise<Channel> {
    const [result] = await pool.execute(
      'INSERT INTO channels (name, avatar, subscriber_count, url, youtube_id, company_id) VALUES (?,?,?,?,?,?)',
      [input.name, input.avatar, input.subscriberCount, input.url, input.youtubeId, companyId]
    );
    const insertId = (result as any).insertId;
    return (await this.findById(insertId, companyId)) as Channel;
  }

  async delete(id: number, companyId: number): Promise<void> {
    await pool.execute('DELETE FROM channels WHERE id = ? AND company_id = ?', [id, companyId]);
  }

  private mapRow(row: any): Channel {
    return {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      subscriberCount: row.subscriber_count,
      url: row.url,
      youtubeId: row.youtube_id,
      companyId: row.company_id,
      addedAt: row.added_at,
    };
  }
}
