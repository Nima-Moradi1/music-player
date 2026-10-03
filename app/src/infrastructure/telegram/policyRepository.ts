import {createMMKV} from 'react-native-mmkv';
import {
  parseTelegramPolicy,
  type TelegramPolicy,
  type TelegramPolicyRepository,
} from '../../domain/telegram/policy';

export class MMKVTelegramPolicyRepository implements TelegramPolicyRepository {
  private readonly storage = createMMKV({id: 'telegram-policy.v1'});
  read(): TelegramPolicy {
    try {
      return parseTelegramPolicy(JSON.parse(this.storage.getString('policy') ?? 'null'));
    } catch {
      return parseTelegramPolicy(null);
    }
  }
  write(policy: TelegramPolicy): void {
    this.storage.set('policy', JSON.stringify(parseTelegramPolicy(policy)));
  }
}
