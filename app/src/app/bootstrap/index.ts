import {MMKVSettingsRepository} from '../../infrastructure/database/settingsRepository';
import {openLibraryDatabase} from '../../infrastructure/database/opSqlite';
import {migrate} from '../../infrastructure/database/migrations';
import {SqliteTrackRepository} from '../../infrastructure/database/trackRepository';
import {SqlitePlaylistRepository} from '../../infrastructure/database/playlistRepository';
import {NativeManagedFilesystem} from '../../infrastructure/filesystem/managedFilesystem';
import {selectAudioFiles} from '../../infrastructure/filesystem/filePicker';
import {managedMediaNative} from '../../native/ManagedMedia';
import {SqliteImportJournal} from '../../infrastructure/database/importJournal';
import {ImportMedia} from '../../domain/import/importMedia';
import {initializeI18n} from '../../shared/i18n';
import {createAppState, type Services} from '../providers/Services';
let ready: Promise<Services> | null = null;
export function bootstrap(): Promise<Services> {
  if (ready) {
    return ready;
  }
  ready = initialize().catch(error => {
    ready = null;
    throw error;
  });
  return ready;
}
async function initialize(): Promise<Services> {
  const preferences = new MMKVSettingsRepository();
  const settings = preferences.read();
  await initializeI18n(settings.locale);
  const database = openLibraryDatabase();
  try {
    await migrate(database);
    const tracks = new SqliteTrackRepository(database);
    const bridge = managedMediaNative();
    const state = createAppState(settings);
    const files = new NativeManagedFilesystem(bridge);
    const journal = new SqliteImportJournal(database);
    await journal.recover(files);
    return {
      tracks,
      playlists: new SqlitePlaylistRepository(database),
      preferences,
      database,
      state,
      createId: () => bridge.createId(),
      selectFiles: selectAudioFiles,
      importer: new ImportMedia(
        files,
        tracks,
        () => bridge.createId(),
        () => state.getState().settings.maxImportBytes,
        journal,
      ),
    };
  } catch (error) {
    database.close();
    throw error;
  }
}
