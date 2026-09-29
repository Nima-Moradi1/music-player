export type Recommendation = {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  source: string;
  reason: string;
};
export interface RecommendationProvider {
  related(input: {
    artist: string;
    genre?: string;
    localePriority: string[];
  }): Promise<Recommendation[]>;
}
export type DownloadHandle = {id: string; cancel(): Promise<void>};
export interface DownloadProvider {
  canDownload(item: Recommendation): Promise<boolean>;
  download(item: Recommendation): Promise<DownloadHandle>;
}
