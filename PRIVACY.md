# Privacy

The app is designed to keep songs, playlists, favorites, listening history, playback positions, search, lyrics caches, fingerprints, and import provenance on the device. There is no user account, backend, or analytics SDK.

Local file import is explicit. Imported files are copied to app-managed storage; deleting the original file does not remove the managed copy. On iOS, deleting the app removes its sandbox unless the user has exported a backup. Backup/export is a later implementation task.

Telegram is optional and is not enabled in Phase 1. When implemented, it will authenticate a separate TDLib client session and scan only sources the user explicitly chooses. It will not read the Telegram app's private cache, manipulate read status, delete original messages, or train AI models. Disconnecting must preserve imported music unless the user requests deletion separately.

Remote lyrics/recommendation providers are disabled until their terms and minimum metadata requests are documented and accepted for production. They must never receive audio, a user's complete library, Telegram content, or history. No telemetry by default. Any future diagnostics export must require a user action and redact private fields.

