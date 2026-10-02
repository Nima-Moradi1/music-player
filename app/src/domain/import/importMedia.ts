import type {ImportJournal, ManagedFilesystem, MediaImporter} from './index';
import type {TrackRepository, TrackSource} from '../track';
import {classifyLanguage, normalizeSearch} from '../track/normalize';
import {AppError} from '../../shared/errors';

export class ImportMedia implements MediaImporter {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(
    private readonly files: ManagedFilesystem,
    private readonly tracks: TrackRepository,
    private readonly createId: () => Promise<string>,
    private readonly maxBytes: () => number,
    private readonly journal?: ImportJournal,
  ) {}
  import(uri: string, source: TrackSource, signal: AbortSignal) {
    const work = () => this.execute(uri, source, signal);
    const next = this.tail.then(work, work);
    this.tail = next.catch(() => undefined);
    return next;
  }
  private async execute(uri: string, source: TrackSource, signal: AbortSignal) {
    let staged: string | null = null;
    let promoted: string | null = null;
    let artwork: string | null = null;
    let committed = false;
    const jobId = await this.createId();
    await this.journal?.begin(jobId, source);
    try {
      if (signal.aborted) {
        throw new Error('Cancelled');
      }
      if ((await this.files.freeBytes()) < 2 * 1024 * 1024) {
        throw new AppError('IMPORT_NO_SPACE');
      }
      staged = await this.files.stage(uri, this.maxBytes(), signal);
      const media = await this.files.inspect(staged, signal);
      await this.journal?.inspected(jobId, staged, media.sha256);
      if (signal.aborted) {
        throw new Error('Cancelled');
      }
      const existing = await this.tracks.findByHash(media.sha256);
      if (existing) {
        // Artwork is hash-addressed and may already belong to the original track.
        await this.tracks.addSource(existing.id, source);
        committed = true;
        await this.journal?.finish(jobId, existing.id, null);
        return {track: existing, duplicate: true};
      }
      artwork = media.artworkPath;
      const classification = classifyLanguage({
        text: `${media.title} ${media.artist}`,
        ...(media.metadataLanguage ? {metadataLanguage: media.metadataLanguage} : {}),
      });
      const id = jobId;
      if (signal.aborted) {
        throw new Error('Cancelled');
      }
      promoted = await this.files.promote(staged, media.sha256, media.extension);
      staged = null;
      if (signal.aborted) {
        throw new Error('Cancelled');
      }
      const title = media.title.trim() || source.originalFilename.replace(/\.[^.]+$/, '');
      const track = {
        id,
        title,
        normalizedTitle: normalizeSearch(title),
        artist: media.artist,
        album: media.album,
        genre: media.genre,
        canonicalUri: promoted,
        managedPath: promoted,
        contentHash: media.sha256,
        durationMs: media.durationMs,
        fileSize: media.fileSize,
        mimeType: media.mimeType,
        extension: media.extension,
        artworkPath: media.artworkPath,
        language: classification.language,
        languageConfidence: classification.confidence,
        favorite: false,
        createdAt: Date.now(),
      };
      await this.tracks.save(track, source);
      committed = true;
      promoted = null;
      artwork = null;
      await this.journal?.finish(jobId, track.id, null);
      return {track, duplicate: false};
    } catch (error) {
      if (!committed) {
        await this.journal?.finish(
          jobId,
          null,
          signal.aborted
            ? 'CANCELLED'
            : error instanceof AppError
              ? error.code
              : 'IMPORT_CORRUPT_FILE',
        );
      }
      throw error;
    } finally {
      if (staged) {
        await this.files.remove(staged);
      }
      if (promoted) {
        await this.files.remove(promoted);
      }
      if (artwork) {
        await this.files.remove(artwork);
      }
    }
  }
}
