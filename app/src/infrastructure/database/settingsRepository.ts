import {createMMKV} from 'react-native-mmkv';
import {parseSettings, type Settings, type SettingsRepository} from '../../domain/settings';

export class MMKVSettingsRepository implements SettingsRepository {
  private readonly storage = createMMKV({id: 'preferences.v1'});
  read(): Settings {
    try {
      return parseSettings(JSON.parse(this.storage.getString('settings') ?? 'null'));
    } catch {
      return parseSettings(null);
    }
  }
  write(settings: Settings): void {
    this.storage.set('settings', JSON.stringify(settings));
  }
}
