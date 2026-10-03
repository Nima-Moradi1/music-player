import {z} from 'zod';

export const telegramPolicySchema = z.object({
  version: z.literal(1),
  consent: z.boolean(),
  savedMessages: z.boolean(),
  privateChats: z.boolean(),
  channels: z.boolean(),
  groups: z.boolean(),
  autoImport: z.boolean(),
  paused: z.boolean().default(false),
  excludedChatIds: z.array(z.string()).max(1000).default([]),
  wifiOnly: z.boolean(),
  maxFileBytes: z
    .number()
    .int()
    .positive()
    .max(1024 * 1024 * 1024),
  maxStorageBytes: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024 * 1024)
    .default(2 * 1024 * 1024 * 1024),
});
export type TelegramPolicy = z.infer<typeof telegramPolicySchema>;
export const defaultTelegramPolicy: TelegramPolicy = {
  version: 1,
  consent: false,
  savedMessages: true,
  privateChats: true,
  channels: false,
  groups: false,
  autoImport: true,
  paused: false,
  excludedChatIds: [],
  wifiOnly: true,
  maxFileBytes: 512 * 1024 * 1024,
  maxStorageBytes: 2 * 1024 * 1024 * 1024,
};
export function parseTelegramPolicy(value: unknown): TelegramPolicy {
  const result = telegramPolicySchema.safeParse(value);
  // Channel/group imports require additional product and terms work.
  return result.success
    ? {...result.data, channels: false, groups: false}
    : {...defaultTelegramPolicy};
}
export interface TelegramPolicyRepository {
  read(): TelegramPolicy;
  write(policy: TelegramPolicy): void;
}
