import type {Playlist, PlaylistRepository} from '../../domain/playlist';
import type {Track} from '../../domain/track';
import type {Database} from './contracts';
import {mapTrack, selectTrack} from './trackRepository';

function validName(name: string): string {
  const value = name.trim();
  if (!value || value.length > 120) {
    throw new Error('Invalid playlist name');
  }
  return value;
}
export class SqlitePlaylistRepository implements PlaylistRepository {
  constructor(private readonly database: Database) {}
  async list(): Promise<Playlist[]> {
    const result = await this.database.execute(
      'SELECT p.*,COUNT(pt.track_id) AS count FROM playlists p LEFT JOIN playlist_tracks pt ON pt.playlist_id=p.id GROUP BY p.id ORDER BY p.updated_at DESC',
    );
    return result.rows.map(row => ({
      id: String(row.id),
      name: String(row.name),
      count: Number(row.count),
      createdAt: Number(row.created_at),
    }));
  }
  async create(id: string, name: string): Promise<void> {
    await this.database.execute('INSERT INTO playlists VALUES (?,?,?,?)', [
      id,
      validName(name),
      Date.now(),
      Date.now(),
    ]);
  }
  async rename(id: string, name: string): Promise<void> {
    await this.database.execute('UPDATE playlists SET name=?,updated_at=? WHERE id=?', [
      validName(name),
      Date.now(),
      id,
    ]);
  }
  async delete(id: string): Promise<void> {
    await this.database.execute('DELETE FROM playlists WHERE id=?', [id]);
  }
  async addTrack(id: string, trackId: string): Promise<void> {
    await this.database.transaction(async session => {
      await session.execute(
        'INSERT OR IGNORE INTO playlist_tracks (playlist_id,track_id,position) SELECT ?,?,COALESCE(MAX(position),-1)+1 FROM playlist_tracks WHERE playlist_id=?',
        [id, trackId, id],
      );
      await session.execute('UPDATE playlists SET updated_at=? WHERE id=?', [Date.now(), id]);
    });
  }
  async removeTrack(id: string, trackId: string): Promise<void> {
    await this.database.execute('DELETE FROM playlist_tracks WHERE playlist_id=? AND track_id=?', [
      id,
      trackId,
    ]);
  }
  async tracks(id: string, offset = 0): Promise<Track[]> {
    const result = await this.database.execute(
      `${selectTrack} JOIN playlist_tracks pt ON pt.track_id=t.id WHERE pt.playlist_id=? ORDER BY pt.position LIMIT 60 OFFSET ?`,
      [id, Math.max(0, offset)],
    );
    return result.rows.map(mapTrack);
  }
}
