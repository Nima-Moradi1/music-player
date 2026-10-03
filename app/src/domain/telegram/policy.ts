import {z} from 'zod';

export const telegramPolicySchema = z.object({
  version: z.literal(1),
  consent: z.boolean(),
  savedMessages: z.boolean(),
  privateChats: z.boolean(),
  channels: z.boolean(),
  groups: z.boolean(),
  autoImport: z.boolean(),
  wifiOnly: z.boolean(),
  maxFileBytes: z
    .number()
    .int()
    .positive()
    .max(1024 * 1024 * 1024),
});
export type TelegramPolicy = z.infer<typeof telegramPolicySchema>;
export const defaultTelegramPolicy: TelegramPolicy = {
  version: 1,
  consent: false,
  savedMessages: true,
  privateChats: true,
  channels: true,
  groups: false,
  autoImport: true,
  wifiOnly: true,
  maxFileBytes: 512 * 1024 * 1024,
};
export function parseTelegramPolicy(value: unknown): TelegramPolicy {
  const result = telegramPolicySchema.safeParse(value);
  return result.success ? result.data : {...defaultTelegramPolicy};
}
export interface TelegramPolicyRepository {
  read(): TelegramPolicy;
  write(policy: TelegramPolicy): void;
}
