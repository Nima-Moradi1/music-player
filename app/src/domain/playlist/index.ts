import type {Track} from '../track';
export type Playlist = {
  id: string;
  name: string;
  count: number;
  createdAt: number;
};
export interface PlaylistRepository {
  list(): Promise<Playlist[]>;
  create(id: string, name: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  delete(id: string): Promise<void>;
  addTrack(id: string, trackId: string): Promise<void>;
  removeTrack(id: string, trackId: string): Promise<void>;
  tracks(id: string, offset?: number): Promise<Track[]>;
}
