export const errorCodes = [
  'AUTH_REQUIRED',
  'AUTH_CODE_INVALID',
  'AUTH_PASSWORD_REQUIRED',
  'TELEGRAM_RATE_LIMIT',
  'TELEGRAM_NETWORK',
  'TELEGRAM_FILE_UNAVAILABLE',
  'IMPORT_UNSUPPORTED_FORMAT',
  'IMPORT_CORRUPT_FILE',
  'IMPORT_NO_SPACE',
  'DOWNLOAD_NOT_ALLOWED',
  'LYRICS_NOT_FOUND',
  'PLAYBACK_UNSUPPORTED',
  'PLAYBACK_ENGINE_ERROR',
  'DATABASE_ERROR',
  'PERMISSION_DENIED',
  'UNKNOWN',
] as const;
export type ErrorCode = (typeof errorCodes)[number];
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'AppError';
  }
}
export type Unsubscribe = () => void;
