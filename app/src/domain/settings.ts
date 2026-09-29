import {z} from 'zod';
export const settingsSchema = z.object({
  version: z.literal(1),
  theme: z.enum(['system', 'light', 'dark']),
  locale: z.enum(['en', 'fa']),
  onboarded: z.boolean(),
  reduceMotion: z.boolean(),
  reduceTransparency: z.boolean(),
  highContrast: z.boolean(),
  maxImportBytes: z
    .number()
    .int()
    .positive()
    .max(1024 * 1024 * 1024),
});
export type Settings = z.infer<typeof settingsSchema>;
export const defaultSettings: Settings = {
  version: 1,
  theme: 'system',
  locale: 'en',
  onboarded: false,
  reduceMotion: false,
  reduceTransparency: false,
  highContrast: false,
  maxImportBytes: 512 * 1024 * 1024,
};
export interface SettingsRepository {
  read(): Settings;
  write(settings: Settings): void;
}
export function parseSettings(value: unknown): Settings {
  const result = settingsSchema.safeParse(value);
  return result.success ? result.data : {...defaultSettings};
}
