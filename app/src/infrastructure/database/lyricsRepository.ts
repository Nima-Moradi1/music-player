import type {Database} from './contracts';
import {parseLrc, type LyricsDocument, type LyricsRepository} from '../../domain/lyrics';

export class SqliteLyricsRepository implements LyricsRepository {
  constructor(private readonly database: Database) {}

  async getLocal(trackId: string): Promise<LyricsDocument | null> {
    const result = await this.database.execute(
      "SELECT id,text,offset_ms,license FROM lyrics WHERE track_id=? AND provider IN ('manual','embedded') ORDER BY CASE provider WHEN 'manual' THEN 0 ELSE 1 END LIMIT 1",
      [trackId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const lineResult = await this.database.execute(
      'SELECT at_ms,text FROM lyrics_lines WHERE lyrics_id=? ORDER BY position',
      [String(row.id)],
    );
    return {
      id: String(row.id),
      text: String(row.text),
      offsetMs: Number(row.offset_ms),
      license: String(row.license),
      lines: lineResult.rows.map(line => ({atMs: Number(line.at_ms), text: String(line.text)})),
    };
  }

  async saveLocal(trackId: string, text: string, offsetMs: number): Promise<LyricsDocument> {
    return this.save(trackId, text, offsetMs, 'manual', 'user-supplied');
  }

  async saveEmbedded(trackId: string, text: string): Promise<LyricsDocument> {
    return this.save(trackId, text, 0, 'embedded', 'embedded-in-user-file');
  }

  private async save(
    trackId: string,
    text: string,
    offsetMs: number,
    provider: 'manual' | 'embedded',
    license: string,
  ): Promise<LyricsDocument> {
    if (
      !text.trim() ||
      text.length > 100_000 ||
      !Number.isInteger(offsetMs) ||
      Math.abs(offsetMs) > 30_000
    ) {
      throw new Error('Invalid local lyrics');
    }
    const id = `${provider}:${trackId}`;
    const lines = parseLrc(text);
    await this.database.transaction(async session => {
      await session.execute('DELETE FROM lyrics WHERE id=?', [id]);
      await session.execute(
        'INSERT INTO lyrics (id,track_id,provider,text,offset_ms,license,cached_at) VALUES (?,?,?,?,?,?,?)',
        [id, trackId, provider, text, offsetMs, license, Date.now()],
      );
      for (let position = 0; position < lines.length; position++) {
        await session.execute(
          'INSERT INTO lyrics_lines (lyrics_id,position,at_ms,text) VALUES (?,?,?,?)',
          [id, position, lines[position]!.atMs, lines[position]!.text],
        );
      }
    });
    return {id, text, lines, offsetMs, license};
  }
}
