# ULTIMATE REACT NATIVE MUSIC PLAYER — CODEX MASTER IMPLEMENTATION SPEC

> Purpose: build a production-ready, local-first, privacy-first music player for Android + iOS with automated Telegram music import through TDLib, native background playback, modern glass/motion UI, advanced gestures, synced lyrics, recommendations, widgets, DSP, robust testing, and release/export guides.
>
> Execution target: Codex.
>
> Rule: do not rewrite finished work. Read `HANDOFF.md` first. Continue from exact next task.

---

# 0. PRODUCT PRINCIPLE

Build a music player that feels radically modern but remains obvious to non-technical users.

Core identity:

- local-first; no account required except optional Telegram login.
- user music stays on device.
- no song/history/play-position database on our servers.
- offline playback always works.
- Telegram import becomes automatic after explicit setup/consent.
- sophisticated gestures never replace visible controls.
- accessibility > visual effect.
- performance > decorative animation.
- deterministic behavior > clever hidden magic.
- beautiful enough for enthusiasts; simple enough for elderly/new users.
- no copying JetAudio UI/assets/proprietary effects. Match broad capability, not proprietary implementation.

Product placeholder name: `APP_NAME`. Keep branding tokens replaceable.

---

# 1. HARD TRUTHS / NON-NEGOTIABLES

## Telegram

Use **TDLib** as a separate Telegram client session.

TDLib does NOT read Telegram app private cache. Instead:

1. user explicitly connects Telegram.
2. app authenticates through TDLib.
3. app discovers accessible chats/messages.
4. app finds audio messages/documents.
5. app downloads matching files through TDLib.
6. completed files are imported into our managed library.
7. new eligible Telegram audio can auto-import afterward.

Support:

- Saved Messages.
- regular private chats.
- channels.
- groups/supergroups if user enables.
- Main + Archive chat lists.
- audio sent as Telegram `messageAudio`.
- audio sent as document with supported extension/MIME.
- MP3, FLAC, M4A/AAC minimum.
- extensible codec registry.

Do not silently take Telegram actions unrelated to import.

Telegram compliance gates:

- own Telegram `api_id` / `api_hash`.
- disclose Telegram API usage.
- explicit user consent before scan/download.
- obey current Telegram API/TDLib terms before each production release.
- no Telegram data used to train/fine-tune/develop ML/AI models.
- no hidden read-status/message/action manipulation.
- no scraping around TDLib.
- if current Telegram terms make the intended integration non-compliant, mark `BLOCKER-TELEGRAM-COMPLIANCE`; do not bypass.

Useful official references:
- https://core.telegram.org/tdlib
- https://core.telegram.org/tdlib/getting-started
- https://core.telegram.org/api/terms
- https://core.telegram.org/api/obtaining_api_id

## Downloads/recommendations

Never implement arbitrary copyrighted-song scraping.

Only show a direct Download action when provider terms/license explicitly allow it.

Architecture must support:

`RecommendationProvider -> DownloadProvider[] -> permitted download OR metadata-only result`

Persian/Iranian sources get recommendation priority only when legally/technically permitted.

## Privacy

No remote persistence of:

- songs.
- Telegram chats/messages.
- listening history.
- play positions.
- playlists.
- search history.
- imported metadata.
- audio fingerprints.

Optional remote provider requests must send only minimum metadata required and must be documented.

No telemetry by default. If analytics/crash reporting is later enabled:

- explicit config.
- scrub track titles, chat titles, usernames, phone numbers, Telegram IDs.
- never upload audio.
- opt-out available.

---

# 2. FIXED TECHNOLOGY DIRECTION

Use versions compatible at implementation time; pin exact versions in lockfile.

Baseline:

- React Native `0.87.x`, New Architecture.
- React 19.
- TypeScript strict.
- Node 22+.
- pnpm.
- Android: Kotlin 2+, AGP 9+, Gradle wrapper committed.
- iOS: Swift + Obj-C++ only where C/C++ interop required.
- Hermes.
- no Expo-managed architecture.
- no React Native Track Player dependency.
- custom native audio abstraction from day one.

UI:

- React Navigation.
- React Native Gesture Handler 3.x compatible with RN 0.87.
- Reanimated 4.x + `react-native-worklets`.
- React Native Skia.
- Zustand: ephemeral UI/app state.
- TanStack Query: remote provider requests/cache orchestration only.
- Zod: boundary validation.
- i18next or equivalent: localization.
- MMKV v4: tiny fast settings/preferences.
- SQLite high-performance RN library verified with RN 0.87 before install.
- migrations mandatory.

Native:

### Android

- Media3 / ExoPlayer.
- `MediaSessionService` / `MediaLibraryService`.
- MediaSession + notification/system controls.
- Audio focus.
- Kotlin coroutines.
- AndroidX.
- MediaStore only for optional local-device discovery/export.

### iOS

- AVFoundation.
- AVAudioSession `.playback`.
- AVPlayer/AVQueuePlayer and/or AVAudioEngine depending DSP path.
- MediaPlayer / Now Playing Info.
- MPRemoteCommandCenter.
- WidgetKit + App Intents.
- background audio capability.

Telegram:

- TDLib official source/binary.
- native wrapper behind a stable TS interface.
- TDLib DB encryption key stored in Keychain/Android Keystore.
- TDLib API/session details never exposed through feature UI.

Optional provider gateway:

- create only if a provider requires a secret that must not ship in app.
- TypeScript + Hono on Cloudflare Workers or similarly minimal stateless runtime.
- no DB.
- no user account.
- no song/history persistence.
- strict rate limits.
- redact logs.
- separate deployable directory.

---

# 3. REPOSITORY STRUCTURE

Create this structure early. Do not flatten it later.

```text
/
├─ app/
│  ├─ android/
│  ├─ ios/
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ navigation/
│  │  │  ├─ providers/
│  │  │  ├─ lifecycle/
│  │  │  └─ bootstrap/
│  │  ├─ design-system/
│  │  │  ├─ tokens/
│  │  │  ├─ theme/
│  │  │  ├─ typography/
│  │  │  ├─ spacing/
│  │  │  ├─ motion/
│  │  │  ├─ haptics/
│  │  │  ├─ icons/
│  │  │  ├─ primitives/
│  │  │  └─ components/
│  │  ├─ domain/
│  │  │  ├─ track/
│  │  │  ├─ artist/
│  │  │  ├─ album/
│  │  │  ├─ playlist/
│  │  │  ├─ queue/
│  │  │  ├─ playback/
│  │  │  ├─ import/
│  │  │  └─ lyrics/
│  │  ├─ features/
│  │  │  ├─ onboarding/
│  │  │  ├─ home/
│  │  │  ├─ library/
│  │  │  ├─ player/
│  │  │  ├─ queue/
│  │  │  ├─ search/
│  │  │  ├─ playlists/
│  │  │  ├─ lyrics/
│  │  │  ├─ telegram/
│  │  │  ├─ imports/
│  │  │  ├─ downloads/
│  │  │  ├─ discovery/
│  │  │  ├─ equalizer/
│  │  │  └─ settings/
│  │  ├─ infrastructure/
│  │  │  ├─ database/
│  │  │  ├─ filesystem/
│  │  │  ├─ metadata/
│  │  │  ├─ telegram/
│  │  │  ├─ audio/
│  │  │  ├─ lyrics/
│  │  │  ├─ recommendations/
│  │  │  ├─ downloads/
│  │  │  └─ diagnostics/
│  │  ├─ native/
│  │  │  ├─ audio/
│  │  │  ├─ telegram/
│  │  │  ├─ widgets/
│  │  │  └─ sensors/
│  │  ├─ shared/
│  │  └─ testing/
│  ├─ assets/
│  └─ package.json
├─ services/
│  └─ provider-gateway/     # optional; disabled until needed
├─ docs/
│  ├─ architecture/
│  ├─ adr/
│  ├─ phases/
│  ├─ qa/
│  ├─ release/
│  └─ handoff/archive/
├─ scripts/
├─ HANDOFF.md
├─ IMPLEMENTATION_STATUS.md
├─ SECURITY.md
├─ PRIVACY.md
├─ CONTRIBUTING.md
├─ pnpm-workspace.yaml
└─ package.json
```

Dependency rule:

`feature -> domain -> interface -> infrastructure/native`

Never:

`screen -> raw native module`

Never let features import another feature's private internals.

Public feature API through `index.ts`.

---

# 4. CORE CONTRACTS

Create interfaces before implementations.

```ts
interface AudioEngine {
  load(track: PlayableTrack): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seekTo(ms: number): Promise<void>;
  setVolume(value: number): Promise<void>;
  setRate(value: number): Promise<void>;
  setPitch(value: number): Promise<void>;
  setRepeat(mode: RepeatMode): Promise<void>;
  setShuffle(enabled: boolean): Promise<void>;
  setEqualizer(config: EqualizerConfig): Promise<void>;
  setCrossfade(ms: number): Promise<void>;
  getState(): Promise<PlaybackSnapshot>;
  subscribe(listener: PlaybackListener): Unsubscribe;
}

interface TelegramImportService {
  getAuthState(): Promise<TelegramAuthState>;
  submitPhone(phone: string): Promise<void>;
  submitCode(code: string): Promise<void>;
  submitPassword(password: string): Promise<void>;
  scan(options: TelegramScanOptions): Promise<ImportJobId>;
  pause(jobId: ImportJobId): Promise<void>;
  resume(jobId: ImportJobId): Promise<void>;
  cancel(jobId: ImportJobId): Promise<void>;
  setAutoImport(config: AutoImportConfig): Promise<void>;
  subscribe(listener: TelegramImportListener): Unsubscribe;
}

interface LyricsProvider {
  find(track: TrackIdentity): Promise<LyricsCandidate[]>;
  get(id: string): Promise<LyricsDocument | null>;
}

interface RecommendationProvider {
  related(input: {
    artist: string;
    genre?: string;
    localePriority: string[];
  }): Promise<Recommendation[]>;
}

interface DownloadProvider {
  canDownload(item: Recommendation): Promise<boolean>;
  download(item: Recommendation): Promise<DownloadHandle>;
}
```

Native API rules:

- version native contracts.
- typed events.
- no unbounded event spam.
- progress event max ~4-10 updates/sec.
- all native errors mapped to stable error codes.
- cancellation supported.
- no JS busy polling.
- long work off JS/UI threads.

---

# 5. LOCAL DATA MODEL

SQLite. Normalized enough for consistency; optimized indexes for library/search.

Minimum tables:

```text
tracks
artists
albums
genres
track_artists
track_genres
playlists
playlist_tracks
track_sources
playback_progress
play_history
favorites
lyrics
lyrics_lines
imports
import_items
telegram_chats
telegram_scan_cursors
downloads
provider_cache
schema_migrations
```

Important `tracks` fields:

```text
id UUID
content_hash nullable until available
canonical_uri
managed_path
title
normalized_title
album_id
duration_ms
mime_type
extension
file_size
bitrate
sample_rate
channels
year
disc_no
track_no
artwork_path
language_code
language_confidence
created_at
updated_at
```

`track_sources`:

```text
track_id
source_type: telegram | local | app_download | manual_import
telegram_chat_id nullable
telegram_message_id nullable
telegram_sender_id nullable
telegram_date nullable
telegram_source_kind nullable
original_filename
```

Do not use transient TDLib `file_id` as application primary identity.

Dedup strategy:

1. same Telegram chat + message => same source.
2. once file complete: streaming SHA-256.
3. same SHA-256 => one physical media file.
4. multiple provenance records may reference one track.
5. never duplicate physical audio just because it belongs to multiple categories.

Collections are virtual metadata, not physical duplicated folders.

---

# 6. FILE STORAGE

Managed storage:

```text
APP_DATA/
├─ media/
│  ├─ audio/
│  ├─ artwork/
│  └─ temp/
├─ lyrics/
├─ telegram/
└─ backups/
```

Import transaction:

```text
download/temp
-> validate magic/MIME
-> inspect metadata
-> stream hash
-> dedupe
-> sanitize filename
-> atomic move
-> DB transaction
-> artwork extraction
-> category assignment
-> library event
```

Never trust extension alone.

Reject:

- executable masquerading as audio.
- malformed/unsupported file.
- zero-byte.
- incomplete TDLib file.
- file larger than configured safety limit.

Cleanup orphan temp files after crashes.

Local backup:

- user-triggered export/import.
- includes DB + settings + playlists + lyrics + optionally managed audio.
- optional encrypted archive.
- document limitation: iOS app deletion removes sandbox unless user exported backup.
- Android optional export to user-selected shared location through system picker.

---

# 7. LANGUAGE / SMART CATEGORIZATION

No model training. No AI dependency.

Deterministic pipeline:

```text
embedded metadata
-> title/artist/album
-> Unicode script detection
-> known public artist metadata if permitted/online
-> lyrics language if available
-> confidence
-> category or Other Songs
```

Default categories:

- Persian
- English
- Arabic
- Spanish
- Other Songs

Architecture supports unlimited languages later.

Rules:

- Persian/Arabic script alone is not enough to distinguish Persian vs Arabic.
- Latin transliteration is uncertain.
- low confidence => `Other Songs`.
- user correction always wins.
- remember correction locally.
- corrections never train remote models.
- one physical song may appear in Source + Language + Genre + Playlist simultaneously.

---

# 8. DESIGN SYSTEM — "GLASS WITHOUT CONFUSION"

Create design system before feature screens.

## Foundations

Token groups:

```text
color
semantic-color
opacity
blur
surface
elevation
radius
spacing
size
typography
motion
z-index
haptic
```

No raw hex/radius/spacing values inside feature screens.

Glass surfaces:

```text
glass/subtle
glass/standard
glass/elevated
glass/modal
glass/player
```

Every glass component must have:

- fallback solid surface.
- measurable text contrast.
- dark/light behavior.
- reduced-transparency behavior.
- low-performance fallback.

Dynamic artwork palette:

- extract locally.
- derive safe background accents.
- never directly use raw dominant color for text.
- semantic contrast layer decides foreground.

## Accessibility

Mandatory:

- iOS touch target >= 44pt.
- Android touch target >= 48dp.
- screen-reader labels/actions.
- Dynamic Type / font scaling.
- TalkBack/VoiceOver order tested.
- reduce motion.
- reduce transparency/high contrast fallback.
- color never sole status indicator.
- visible equivalent for every important gesture.
- captions/text for icon-only unfamiliar controls.
- RTL-ready from phase 1.
- Persian + English layouts validated.
- Arabic-ready architecture.

## Motion

Motion should communicate state, not decorate everything.

Targets:

- 60fps minimum.
- 120Hz smooth when hardware supports.
- per-frame visual work stays UI/native thread.
- no React state updates each playback frame.
- progress UI interpolated between native snapshots.
- spring/timing tokens centralized.
- no motion > ~500ms for routine controls.
- reduced-motion mode uses fade/instant alternatives.

Skia reserved for:

- artwork treatment.
- waveform/spectrum.
- high-value glass/refraction effects.
- visualizer.
- controlled particles/shaders.

Do not render ordinary text/forms in Skia.

---

# 9. NAVIGATION / INFORMATION ARCHITECTURE

Primary bottom navigation:

```text
Home
Library
Discover
Downloads
```

Persistent mini-player above nav when queue active.

Settings through profile/settings action.

Library views:

```text
Songs
Artists
Albums
Genres
Folders/Sources
Languages
Playlists
Favorites
Recently Added
Recently Played
Most Played
Telegram
```

Player:

- artwork.
- track title/artist.
- progress.
- play/pause.
- previous/next.
- queue.
- lyrics.
- favorite.
- repeat/shuffle.
- more actions.
- gesture layer.
- expandable audio controls/EQ.

Never overload default player screen with expert DSP controls.

---

# 10. GESTURE SYSTEM

Gestures customizable in Settings.

Safe defaults:

```text
Artwork swipe left       -> next
Artwork swipe right      -> previous
Artwork double tap       -> favorite toggle
Artwork long press       -> track actions
Artwork swipe up         -> lyrics/now-playing expansion
Player right-edge pan    -> volume
Player left-edge pan     -> configurable; default brightness-like visualizer intensity, NOT system brightness
Mini-player swipe up     -> full player
Mini-player swipe left   -> next
Mini-player swipe right  -> previous
Queue item swipe         -> contextual queue actions
Shake                    -> disabled by default; user assigns action
```

Triple tap:

- available only as optional user mapping.
- never default critical action.

Gesture collision rules:

- horizontal navigation gestures must not trigger track changes accidentally.
- seek bar always owns its drag area.
- accessibility mode can disable edge gestures.
- haptic feedback only at meaningful thresholds.

Seek interaction:

```text
drag
-> show floating timestamp tooltip
-> optional artwork/lyric preview
-> native seek only at throttled intervals/final release
-> commit resume position
```

---

# 11. PLAYER CAPABILITY TARGET

Common advanced music-player parity:

Library:

- browse/sort/filter.
- artist/album/genre.
- folder/source.
- search.
- playlists.
- smart playlists.
- favorites.
- multi-select.
- queue editing.
- metadata view.
- artwork.
- file details.
- duplicate detection.

Playback:

- play/pause/seek.
- queue.
- shuffle.
- repeat off/all/one.
- resume position per track.
- gapless where codec/container supports.
- configurable crossfade.
- playback speed.
- pitch.
- sleep timer.
- A-B repeat.
- ReplayGain when tags/data exist.
- headset/Bluetooth controls.
- route changes.
- notification/lock-screen controls.
- interruptions.
- optional autoplay.
- "play next"/"add to queue".

DSP target:

- preamp.
- 10-band minimum EQ; architecture for 20-band.
- presets + custom presets.
- bass control.
- balance.
- loudness/limiter.
- reverb where stable.
- stereo width where stable.
- rate/tempo.
- pitch.
- crossfade.
- per-output preset option later.

Implement platform-neutral API even when internals differ.

Never advertise a DSP feature until both platforms pass tests.

---

# 12. PLAYBACK STATE / RESUME RULES

Persist progress:

- every ~5 seconds while actively playing.
- on pause.
- track switch.
- queue replacement.
- interruption.
- app lifecycle transition.
- before engine teardown.

Do not write every frame.

Resume rules:

```text
if track completed or position >= configurable completion threshold:
    next play starts from 0
else:
    start from saved position
```

Manual seek near start can reset saved position.

Store:

```text
track_id
position_ms
duration_ms
completed
updated_at
```

Crash recovery must restore:

```text
current track
position
queue
queue index
repeat
shuffle
selected DSP preset
```

Do not auto-start audible playback merely because app relaunched unless platform/user expectation permits. Restore paused-ready state unless background session was genuinely active.

---

# 13. INTERRUPTIONS / ROUTES

State machine must distinguish:

```text
user-paused
playing
interrupted-while-playing
interrupted-while-paused
buffering
ended
error
```

Call/voice/video interruption:

```text
playing -> interruption begins -> pause + remember wasPlaying
interruption ends + resume allowed -> resume only if wasPlaying
```

Never resume if:

- user paused during interruption.
- route unavailable.
- OS says not to resume.
- another app owns audio focus.
- user disabled auto-resume.

Also handle:

- headphones unplugged.
- Bluetooth disconnect.
- Bluetooth reconnect.
- Siri/Assistant.
- navigation prompts.
- another media app.
- alarm/system interruptions.

---

# 14. TELEGRAM AUTOMATION ENGINE

## Onboarding

Explain before authentication:

```text
"Connect Telegram to automatically find and import music from the chats you choose.
The app acts as a Telegram client through TDLib. Music is stored locally on this device."
```

User chooses:

```text
[x] Saved Messages
[x] Private chats
[x] Channels
[ ] Groups
[x] Continue importing new Telegram music automatically
[x] Wi-Fi only for initial bulk import
```

Optional:

- storage limit.
- max file size.
- date range.
- exclude chats.
- import only tagged audio vs audio documents too.

After confirmation => scan starts automatically. No per-song picking.

## Authentication

Support TDLib authorization state machine:

- waitTdlibParameters.
- phone number.
- auth code.
- 2FA password.
- ready.
- logging out/closed.
- errors/retry.

Never store 2FA password.

TDLib DB encryption key:

- random device-local key.
- Keychain/Keystore.
- inaccessible to normal JS persistence.

## Initial scan

Process incrementally.

Per chat:

```text
load chat
-> fetch history/search audio
-> paginate
-> inspect message
-> enqueue candidate
-> persist cursor
-> yield
```

Do not hold complete history in memory.

Candidate rules:

- `messageAudio`, OR
- document with approved MIME/extension.
- exclude voice notes unless user explicitly enables.
- exclude video.
- file size > 0.
- not already imported by provenance/hash.

Priority:

1. currently visible/recent candidates.
2. Saved Messages.
3. selected private chats.
4. selected channels.
5. archive.
6. older history.

Do not assume server returns requested page size.

## Download

Use TDLib download mechanism.

Track:

```text
queued
downloading
paused
completed
validating
importing
done
failed
cancelled
duplicate
```

Progress shown per file + aggregate job.

Use bounded concurrency.

Default:

- 2-3 concurrent downloads on mobile.
- adapt on thermal/network conditions.
- pause bulk sync on cellular when Wi-Fi-only enabled.
- respect Low Power/Data Saver where observable.

After TDLib says download completed:

```text
validate
-> metadata
-> hash
-> import managed copy
-> DB
-> category
-> optionally release TDLib temporary cache
```

Never delete original Telegram message.

## New-message auto import

When TDLib receives a new eligible message:

```text
update
-> policy check
-> duplicate check
-> network/storage check
-> enqueue
-> download
-> import
-> non-intrusive notification
```

User can:

- pause Telegram sync.
- disconnect Telegram.
- exclude one chat.
- exclude one channel.
- delete imported local copy.
- keep local music after disconnect.

Disconnecting Telegram must not delete imported songs unless user separately requests deletion.

## Telegram source UX

Library > Telegram:

```text
All Telegram Music
Saved Messages
Private Chats
Channels
Groups
Excluded
Import Activity
```

Do not expose message content unrelated to music.

Store minimum provenance necessary.

---

# 15. LYRICS

Provider abstraction mandatory.

Flow:

```text
local embedded lyrics
-> local cached lyrics
-> online synced provider
-> online plain lyrics provider
-> unavailable state
```

Search identity priority:

```text
MusicBrainz/ISRC if known
artist + title + duration
artist + title + album
```

Never match only by title.

Synced lyrics:

- LRC-compatible internal representation.
- current line derived from native playback clock.
- precompute line index for binary search.
- smooth scroll.
- manual offset adjustment.
- store offset locally per track.
- allow unsynced view.
- cache successful result.

Background playback does not require lyrics UI to stay alive.

Commercial release gate:

- verify lyrics provider terms/licensing.
- if uncertain: disable provider in production config.

---

# 16. DISCOVERY / RELATED SONGS

Recommendation input prioritizes:

```text
artist
genre
album/era optional
user locale priority
```

Do not use title similarity as primary ranking.

Default locale preference:

```text
fa-IR / Persian sources
-> regional sources
-> global providers
```

Provider adapters only.

Recommendation UI:

```text
artwork
title
artist
source
why related
preview if permitted
download if permitted
```

Download button only when `DownloadProvider.canDownload === true`.

After download:

```text
managed app storage
-> validate
-> metadata
-> hash
-> dedupe
-> categorize
-> library update
```

Never dump into random Downloads folder.

---

# 17. WIDGETS / SYSTEM SURFACES

Android:

- MediaSession controls.
- notification.
- lock-screen controls.
- home-screen widget.
- compact + medium layouts if practical.

iOS:

- Now Playing.
- Control Center/Lock Screen via MPRemoteCommandCenter.
- WidgetKit widget.
- App Intents for allowed playback actions.

Widget shows:

```text
artwork
title
artist
previous
play/pause
next
```

Widget is secondary. System media controls are primary reliable external surface.

---

# 18. SEARCH

Local search:

- title.
- normalized title.
- artist.
- album.
- genre.
- playlist.
- source.
- language.
- filename.

Normalize:

- case.
- whitespace.
- Persian/Arabic letter variants where safe.
- diacritics where appropriate.
- transliteration optional; must not overwrite original.

Use indexed SQLite search/FTS if benchmark proves useful.

Results appear <100ms target on representative library.

---

# 19. PERFORMANCE BUDGETS

Representative test library:

```text
10,000 tracks
2,000 albums
1,500 artists
several GB files
large Telegram history
```

Targets:

- cold launch to interactive: <= 2.5s on mid-range reference device.
- warm launch: <= 1s target.
- library initial viewport: <= 300ms after DB ready.
- local search perceived response: <= 100ms typical.
- player control response: immediate; <= 100ms perceived.
- no dropped-frame bursts during normal player gestures.
- DB work off UI thread.
- artwork decoded to target size, never full-size blindly.
- list virtualization mandatory.
- bounded image cache.
- bounded provider cache.
- no whole-file reads for hashing/metadata.
- streaming I/O.
- bulk Telegram scan resumable after crash.

Benchmark before optimizing; store benchmark notes in `docs/qa/PERFORMANCE.md`.

---

# 20. ERROR MODEL

Stable domain errors:

```text
AUTH_REQUIRED
AUTH_CODE_INVALID
AUTH_PASSWORD_REQUIRED
TELEGRAM_RATE_LIMIT
TELEGRAM_NETWORK
TELEGRAM_FILE_UNAVAILABLE
IMPORT_UNSUPPORTED_FORMAT
IMPORT_CORRUPT_FILE
IMPORT_NO_SPACE
DOWNLOAD_NOT_ALLOWED
LYRICS_NOT_FOUND
PLAYBACK_UNSUPPORTED
PLAYBACK_ENGINE_ERROR
DATABASE_ERROR
PERMISSION_DENIED
UNKNOWN
```

User-facing messages localized.

Technical detail only in local diagnostics.

Every async long task:

- cancellation.
- retry policy.
- no infinite retries.
- exponential backoff + jitter where appropriate.
- persist resumable state.

---

# 21. SECURITY

Mandatory:

- Keychain/Keystore for TDLib encryption key and secrets appropriate for secure storage.
- never put secrets in Git.
- `.env.example`.
- build-time configs documented.
- sanitize filenames.
- path traversal prevention.
- HTTPS only for providers.
- validate provider JSON with Zod.
- certificate/system TLS defaults; no custom insecure trust.
- no WebView download scraping.
- dependency audit before releases.
- SBOM/license report before production.
- redact logs.
- local diagnostic export requires explicit user action.

`SECURITY.md` must define threat model:

```text
malicious media file
malicious provider response
stolen device
debug logs
supply-chain package
compromised download URL
TDLib auth/session leakage
database corruption
storage exhaustion
```

---

# 22. TEST STRATEGY

Test pyramid:

```text
unit
integration
native unit
component
E2E
manual device matrix
release smoke
```

Unit:

- classifiers.
- progress/resume rules.
- queue.
- shuffle/repeat.
- reducer/state machines.
- filename normalization.
- dedupe.
- recommendation ranking.
- lyrics timing.
- storage policies.

Integration:

- SQLite migrations.
- repositories.
- import transaction.
- crash-resume import.
- duplicate imports.
- provider parsing.
- audio bridge mocks.
- TDLib bridge mocks.

Native:

Android:

- Kotlin/JUnit.
- audio service lifecycle.
- focus interruptions.
- native module serialization.
- TDLib event mapping.

iOS:

- XCTest.
- AVAudioSession interruption mapping.
- remote commands.
- native module event mapping.

E2E:

- onboarding.
- local fixture import.
- play/pause/seek.
- app background/foreground.
- restart/resume.
- queue.
- favorites.
- lyrics mocked.
- Telegram auth mocked.
- Telegram import mocked.
- download mocked.
- accessibility smoke.

Real Telegram tests:

- dedicated test account only.
- never CI production credentials.
- manual/integration lane.
- Saved Messages fixture.
- private chat fixture.
- channel fixture.
- duplicate fixture.
- MP3/FLAC/M4A.
- document-sent audio.
- interrupted download.
- 2FA.
- logout/relogin.

Device testing:

Android:

- current flagship.
- mid-range.
- lower-memory device.
- Android minimum supported.
- current Android.
- Bluetooth earbuds.
- wired headset if device supports.

iOS:

- minimum supported iOS device.
- current iPhone.
- recent Pro/120Hz.
- AirPods/Bluetooth.
- lock screen/background.
- interruptions.

No phase is complete with tests skipped.

---

# 23. GIT / CODE QUALITY

Branch model:

```text
main
feature/phase-01-...
feature/phase-02-...
...
```

Commit by coherent feature.

Examples:

```text
feat(audio): add native playback contract
feat(telegram): implement resumable chat scan
feat(player): persist per-track resume position
test(import): cover duplicate Telegram audio
fix(ios): preserve paused state after interruption
```

No giant "phase done" commit containing unrelated work.

Required:

- ESLint.
- Prettier.
- TypeScript strict.
- no `any` unless documented boundary.
- pre-commit staged checks optional.
- CI: lint + typecheck + unit + relevant native build/test.
- generated code excluded/committed according to tool requirements, documented.
- no disabled test without issue/reason.

---

# 24. CODEX WORKING PROTOCOL

At the start of EVERY session:

```text
1. Read HANDOFF.md.
2. Read IMPLEMENTATION_STATUS.md.
3. Read current phase file only.
4. Read linked ADR/important files only.
5. Check git status/diff.
6. Continue exact Next Steps.
```

Do NOT scan entire repository unless required.

Before editing existing subsystem:

```text
read its public interface
read its tests
read HANDOFF Important files
```

After EVERY meaningful task:

```text
run focused tests
mark task DONE/BLOCKER
update IMPLEMENTATION_STATUS.md
update HANDOFF.md
commit coherent change
```

When blocked:

```text
mark BLOCKER immediately
record exact reason
record failed command/error
record likely files
continue independent tasks
```

Never:

- start duplicate implementation because location is unknown.
- replace working architecture casually.
- hide failing tests.
- leave TODO without status.
- invent provider/legal permission.
- hardcode secrets.
- move to next phase with broken phase gate.
- spend tokens rereading full repo when HANDOFF gives paths.

If architecture changes:

- add short ADR in `docs/adr/`.
- update HANDOFF decision.
- update affected phase status.

---

# 25. HANDOFF.md — STRICT FORMAT

`HANDOFF.md` must remain brutally concise.

Maximum target: ~120 lines.

No history dump.

If old detail matters but is no longer active, archive it:
`docs/handoff/archive/YYYY-MM-DD-phase-X.md`

Use EXACT sections:

```md
# HANDOFF

Updated: YYYY-MM-DD HH:mm
Phase: X — Name
Branch: ...
Last commit: ...
Status: GREEN | BLOCKED | PARTIAL

## Current state
- ...

## What changed
- DONE `path` — short result
- DONE `path` — short result

## Decisions
- ...

## Discoveries
- ...

## Remaining work
- TODO ...
- TODO ...

## Blockers
- BLOCKER none
<!-- OR -->
- BLOCKER-ID — exact issue; impact; next check

## Next steps
1. ...
2. ...
3. ...

## Important files
- `path` — why
- `path` — why

## Verification
- PASS `command`
- FAIL `command` — short error
```

Rules:

- `Current state`: max ~5 bullets.
- `What changed`: only current session/recent relevant changes.
- `Decisions`: only choices next Codex must know.
- `Discoveries`: surprising facts only.
- `Remaining work`: actionable.
- `Blockers`: exact, not vague.
- `Next steps`: 1-5 items.
- `Important files`: max ~12.
- `Verification`: exact commands.
- delete stale bullets.
- archive before HANDOFF becomes long.
- no paragraphs unless impossible.
- never paste logs; save log path or first useful error line.

This file is the resume point. Keep it accurate before stopping.

---

# 26. IMPLEMENTATION_STATUS.md

Persistent checklist. Unlike HANDOFF, keeps complete project progress.

Format:

```md
# Implementation Status

## Phase 1 — Foundation
- [x] P1-T01 ...
- [ ] P1-T02 ...
- [!] P1-T03 BLOCKER-...

## Phase 2 — Audio
...
```

Statuses:

```text
[ ] TODO
[~] IN PROGRESS
[x] DONE
[!] BLOCKED
[-] DROPPED with reason
```

Each phase also gets:
`docs/phases/PHASE_0X_*.md`

Task format:

```md
### P3-T07 — Telegram audio download queue
Status: TODO
Depends: P3-T05, P1-T12
Files: expected paths
Acceptance:
- ...
Tests:
- ...
```

No essay.

---

# 27. THE FIVE PHASES

# PHASE 1 — FOUNDATION, ARCHITECTURE, DESIGN SYSTEM, LOCAL LIBRARY

Goal: production-grade skeleton + beautiful usable local library before native complexity.

## P1 tasks

- initialize RN 0.87.x New Architecture project.
- root pnpm workspace.
- TypeScript strict.
- lint/format/typecheck/test CI.
- environment config.
- app bootstrap/error boundary.
- React Navigation.
- light/dark theme.
- RTL/LTR foundation.
- EN + FA strings.
- design tokens.
- glass primitives.
- buttons/icons/typography/cards/lists/sheets/dialogs/toasts/skeletons.
- motion/haptic tokens.
- accessibility helpers.
- SQLite adapter + migrations.
- MMKV settings adapter.
- repositories.
- base domain models.
- local managed filesystem.
- metadata extractor abstraction.
- SHA-256 streaming dedupe.
- fixture/manual import for development.
- Home.
- Library.
- Songs/Artists/Albums/Genres/Source/Language.
- Favorites.
- playlists CRUD.
- search.
- sorting/filtering.
- mini-player placeholder.
- diagnostics screen hidden behind dev gesture/settings.
- privacy/security docs.
- create all phase docs + HANDOFF/status workflow.

## Phase 1 design gate

Must demonstrate:

```text
beautiful Home
fast Library
10k fixture tracks
light/dark
RTL Persian
font scaling
reduce motion
glass fallback
empty/loading/error states
```

## Phase 1 exit

PASS:

- Android debug build.
- iOS debug build.
- migrations.
- 10k-track fixture benchmark.
- accessibility baseline.
- component tests.
- E2E basic navigation/library.
- no hardcoded visual values in feature screens except documented exceptions.
- HANDOFF current.

Deliverable: polished offline library shell.

---

# PHASE 2 — NATIVE AUDIO CORE, BACKGROUND PLAYBACK, DSP, PLAYER UX

Goal: world-class music player independent from Telegram.

## P2 Android

Implement native playback service:

- Media3 ExoPlayer.
- MediaSessionService/MediaLibraryService.
- foreground media playback.
- notification.
- audio focus.
- headset/media buttons.
- Bluetooth route handling.
- queue.
- seek.
- shuffle/repeat.
- system metadata/artwork.
- gapless where supported.
- crossfade architecture.
- playback parameters.
- native event bridge.

## P2 iOS

Implement:

- AVAudioSession playback category.
- background audio mode.
- native queue/player.
- AVAudioEngine path where DSP needed.
- Now Playing metadata.
- MPRemoteCommandCenter.
- interruption notifications.
- route changes.
- native event bridge.

## P2 shared

- `AudioEngine` adapter.
- deterministic player state machine.
- queue persistence.
- crash restore.
- resume position.
- completion threshold.
- full player UI.
- mini-player real implementation.
- seek tooltip.
- queue sheet.
- favorite.
- sleep timer.
- A-B repeat.
- speed.
- pitch.
- initial EQ.
- presets.
- crossfade.
- ReplayGain support where metadata available.
- gesture command registry.
- default gestures.
- gesture customization.
- shake action optional/off by default.
- artwork palette.
- Skia player effects.
- performance fallback.
- reduced motion/transparency.
- visualizer baseline.

## Phase 2 interruption gate

Real devices:

```text
phone/FaceTime/carrier call equivalent
Siri/Assistant
another media app
headphones unplug
Bluetooth disconnect
screen lock
app background
app killed from UI where platform semantics allow session continuation
```

Resume only when correct.

## Phase 2 exit

PASS:

- MP3.
- FLAC.
- M4A/AAC.
- background playback.
- lock-screen controls.
- system media buttons.
- resume position after restart.
- queue restore.
- interruption behavior.
- 1h playback soak.
- repeated seek stress.
- gestures accessible alternatives.
- player performance budget.
- HANDOFF current.

Deliverable: standalone premium local player.

---

# PHASE 3 — TDLib TELEGRAM AUTOMATION

Goal: user connects Telegram once; app finds/imports music automatically according to policy.

## P3 foundation

- obtain/configure own Telegram API credentials outside Git.
- document production API setup.
- TDLib build integration Android.
- TDLib build integration iOS.
- stable native wrapper.
- auth state mapping.
- secure TDLib DB encryption.
- test account procedure.

## P3 onboarding

Screens:

```text
Connect Telegram
Why access is needed
Privacy explanation
Phone
Code
2FA if needed
Import sources
Network/storage policy
Import progress
Done
```

No misleading "permission to Telegram". It is account authentication.

## P3 scanner

- load Main.
- load Archive.
- enumerate eligible chats.
- identify Saved Messages.
- chat policy.
- paginated history/search.
- `messageAudio`.
- audio-as-document.
- cursors.
- persistent scan state.
- resume after crash.
- bounded memory.
- cancellation.
- pause.
- retry/backoff.
- rate-limit handling.

## P3 import queue

- bounded concurrent downloads.
- updateFile progress.
- Wi-Fi-only rule.
- storage-cap rule.
- low-storage failure.
- file validation.
- metadata.
- hash.
- dedupe.
- atomic managed import.
- source provenance.
- category.
- artwork.
- cleanup.

## P3 continuous sync

- subscribe to TDLib updates.
- eligible new audio auto-queues.
- per-chat exclusions.
- global pause.
- disconnect.
- keep imported music after disconnect.
- non-intrusive import notification.
- import activity/history.

## Phase 3 performance gate

Test:

- 100 audio.
- 1,000 audio.
- long chat history.
- app killed/reopened mid-scan.
- network loss.
- Telegram flood/rate limit.
- low storage.
- same file in multiple chats.
- same message encountered twice.
- corrupt file.
- huge FLAC.
- logout during import.

## Phase 3 compliance gate

Before declaring done:

- verify latest Telegram API ToS.
- verify product disclosure wording.
- verify no prohibited AI/ML use.
- verify own API credentials.
- document any legal/product uncertainty as blocker.

## Phase 3 exit

PASS:

```text
login
scan
automatic import
progress
resume
dedupe
new-message auto import
disconnect
privacy
Android
iOS
```

Deliverable: core differentiator complete.

---

# PHASE 4 — LYRICS, DISCOVERY, DOWNLOADS, WIDGETS, ADVANCED EXPERIENCE

Goal: turn strong player into distinctive premium product.

## P4 lyrics

- embedded lyrics.
- provider abstraction.
- synced lyrics.
- plain lyrics fallback.
- local cache.
- offset control.
- active-line animation.
- manual provider result selection.
- offline cached lyrics.
- rights/provider production gate.

## P4 discovery

- artist + genre recommendation engine.
- Persian locale/provider priority.
- provider adapters.
- explanation metadata.
- duplicate suppression.
- library-aware suggestions.
- no title-only similarity ranking.

## P4 permitted downloads

- DownloadProvider contract.
- legal-capability flag.
- signed/expiring URL handling.
- native resilient download.
- progress.
- pause/cancel where provider supports.
- temp file.
- validation.
- import.
- category.
- duplicate detection.
- beautiful completed/error states.

## P4 widgets

Android:

- widget.
- media session actions.
- artwork/title/artist.
- previous/play-next.
- theme variants.

iOS:

- WidgetKit.
- App Intents.
- artwork/title/artist.
- supported playback actions.
- deep link full player.

## P4 advanced player experience

- refined visualizer.
- advanced EQ UI.
- optional 20-band mode if engine supports both platforms.
- reverb/stereo width/balance where stable.
- crossfade refinement.
- output-aware presets if reliable.
- gesture editor.
- onboarding gesture education.
- contextual coaching shown once.
- dynamic artwork environment.
- 3D parallax using device motion, subtle.
- low-power mode fallback.
- OLED-safe dark experience.
- landscape/tablet adaptations.
- CarPlay/Android Auto only if architecture/support quality meets release bar.

## Phase 4 exit

PASS:

- lyrics timing.
- lyrics offline cache.
- recommendations.
- permitted download pipeline.
- widgets.
- provider outage states.
- no provider secret in app bundle if secret must remain private.
- accessibility.
- battery/performance.
- HANDOFF current.

Deliverable: differentiated complete product.

---

# PHASE 5 — PRODUCTION HARDENING, QA, STORE READINESS, EXPORT

Goal: ship, not demo.

## P5 hardening

- full error audit.
- offline audit.
- crash recovery.
- DB corruption recovery strategy.
- migration rollback/forward testing.
- temp/orphan cleanup.
- storage-pressure handling.
- dependency/license audit.
- security threat model verification.
- privacy data-flow review.
- provider ToS review.
- Telegram ToS review.
- accessibility audit.
- RTL audit.
- localization audit.
- battery audit.
- thermal audit.
- memory profiling.
- startup profiling.
- 10k/50k library stress if hardware allows.
- 24h playback soak.
- repeated interruption soak.
- upgrade-from-old-build test.
- app reinstall/backup-restore docs.
- screenshots/assets.
- privacy policy.
- store descriptions.
- support/troubleshooting docs.

## P5 automation

CI lanes:

```text
lint
typecheck
unit
JS integration
Android debug build
Android native tests
iOS build
iOS native tests
E2E selected
release smoke
```

Release versioning:

- semantic app version.
- monotonically increasing build numbers/version codes.
- changelog.
- signed tag.
- release notes.
- reproducible documented commands.

## P5 release candidate gate

Zero:

- P0 crash.
- P0 data loss.
- known auth leak.
- critical accessibility blocker.
- failing release build.
- failing migration.
- illegal download provider enabled.
- unresolved Telegram compliance blocker.

Deliverable: signed distributable Android/iOS production builds + guides.

---

# 28. ANDROID RELEASE / EXPORT GUIDE TO CREATE

Codex must produce:
`docs/release/ANDROID.md`

Must include current exact commands from generated project.

Minimum process:

```text
1. applicationId finalized.
2. versionCode/versionName set.
3. release keystore generated securely.
4. keystore credentials outside Git.
5. release signing configured.
6. ProGuard/R8 rules tested.
7. release build tested on real device.
8. signed AAB generated.
9. optional signed APK generated for direct testing.
10. bundle inspected.
11. Play Console internal test upload.
12. background media permissions/service declarations verified.
13. privacy/data safety answers documented.
```

Expected Gradle-style outputs:

```text
app/android/app/build/outputs/bundle/release/*.aab
app/android/app/build/outputs/apk/release/*.apk
```

Do not assume command names; verify project Gradle tasks and document exact working commands.

Never commit:

```text
*.jks
*.keystore
keystore.properties
production credentials
```

---

# 29. IOS RELEASE / EXPORT GUIDE TO CREATE

Codex must produce:
`docs/release/IOS.md`

Must include exact current Xcode settings.

Minimum:

```text
1. bundle identifier finalized.
2. Apple Developer team.
3. signing/capabilities.
4. background audio capability.
5. widget App Group if required.
6. version/build.
7. Release config.
8. physical-device release smoke.
9. Product > Archive.
10. Organizer > Distribute App.
11. TestFlight internal.
12. external TestFlight if desired.
13. App Store submission.
14. symbol/crash mapping archive retained.
```

Document:

- app target.
- widget target.
- App Groups.
- entitlements.
- URL schemes/deep links.
- privacy manifest requirements.
- required usage descriptions.
- TDLib native library packaging.
- archive troubleshooting.

Production App Store uploads must follow currently supported Xcode requirements. Verify at release time.

---

# 30. PROVIDER GATEWAY

Do NOT create backend by default.

Create `services/provider-gateway` only when needed to protect a provider secret.

It may:

```text
validate
rate-limit
attach secret
proxy minimum request
cache anonymous public metadata briefly
```

It may NOT:

```text
store user library
store Telegram content
store play history
store songs
store persistent user profiles
```

No database unless future requirements explicitly change product privacy architecture.

If added, create separate HANDOFF-relevant section and deploy guide.

---

# 31. UX STATES REQUIRED FOR EVERY FEATURE

Never ship only happy path.

Every async surface needs:

```text
idle
loading
partial
success
empty
offline
permission/auth required
recoverable error
fatal error
cancelled
```

Imports additionally:

```text
paused
duplicate
unsupported
low storage
rate limited
```

Player additionally:

```text
buffering
interrupted
route unavailable
unsupported codec
```

Beautiful state != vague state. Always tell user what happened and available action.

---

# 32. UI QUALITY BAR

Avoid generic "AI-generated app" look.

Do not overuse:

- huge gradients.
- identical rounded cards.
- excessive blur.
- floating everything.
- meaningless animation.
- tiny low-contrast text.
- hidden-only navigation.

Visual hierarchy:

```text
content first
artwork second
controls obvious
glass supports depth
motion explains transition
```

Player should feel tactile:

- physical spring response.
- subtle depth.
- artwork reacts to motion.
- progress responds immediately.
- contextual haptics.
- sheets inherit artwork environment.
- transitions preserve spatial continuity.

But:

- no nausea-inducing parallax.
- no slow cinematic animation blocking action.
- no blur that destroys contrast.
- no gestures users cannot discover.

---

# 33. RESPONSIVE TARGETS

Support:

- small phones.
- large phones.
- tablets/iPad.
- portrait.
- landscape player.
- safe areas.
- notches/islands.
- gesture navigation.
- keyboard.
- RTL.

Do not scale phone UI blindly onto tablet.

Tablet:

- adaptive two-pane library/player where beneficial.
- queue/lyrics side panel.

---

# 34. OBSERVABILITY WITHOUT CLOUD TRACKING

Local diagnostics:

```text
app version
platform
DB schema
audio engine state
Telegram connection state (redacted)
import job state
recent error codes
storage free/used
native module versions
```

Allow "Export diagnostic report".

Report must redact:

- phone.
- chat names.
- usernames.
- messages.
- track titles if privacy mode.
- paths containing user information.
- credentials.
- auth tokens.

---

# 35. FAILURE / RECOVERY REQUIREMENTS

Test recovery from:

```text
app killed during DB migration
app killed during Telegram scan
app killed during audio download
app killed during hash
app killed during file move
network lost mid-download
disk full mid-import
Bluetooth route loss
call during crossfade
provider timeout
TDLib auth invalidated
corrupt DB
corrupt artwork
corrupt MP3
```

Use atomicity.

No half-imported track may appear playable.

---

# 36. MIGRATIONS

Database migrations:

- numbered.
- transactional when possible.
- tested from every released schema to current.
- never destructive without explicit migration.
- pre-migration backup strategy for dangerous changes.
- schema version included in diagnostics.

Settings migrations too.

---

# 37. PHASE TRANSITION RULE

Codex may move to next phase only when:

```text
all mandatory tasks DONE
all tests PASS
phase acceptance PASS
HANDOFF updated
IMPLEMENTATION_STATUS updated
phase summary archived if needed
git working tree expected/clean
no unresolved blocker that invalidates next phase
```

Independent non-blocking issue may carry forward only if:

- explicitly accepted.
- documented.
- has task ID.
- does not compromise security/data/release.

---

# 38. TASK ID FORMAT

```text
P1-T01
P1-T02
P2-T01
...
```

Bug:

```text
BUG-P3-001
```

Blocker:

```text
BLOCKER-P3-001
```

ADR:

```text
ADR-001
```

Use IDs in commits/HANDOFF when useful.

---

# 39. FIRST CODEX SESSION — EXACT START

Do this in order:

```text
1. Create repo skeleton.
2. Create HANDOFF.md from template.
3. Create IMPLEMENTATION_STATUS.md.
4. Create 5 phase files.
5. Create architecture ADR-001: local-first/native-heavy RN.
6. Initialize RN 0.87.x app.
7. Verify Android debug boot.
8. Verify iOS debug boot.
9. Add strict TS/lint/format/test.
10. Create design-system tokens.
11. Add DB abstraction + first migration.
12. Update HANDOFF.
13. Commit.
```

Do not start Telegram or DSP in first session.

---

# 40. FINAL DEFINITION OF DONE

Product is DONE only when a fresh user can:

```text
install
open
understand onboarding
use local library
connect Telegram knowingly
select import policy
leave phone alone
see Telegram music automatically imported
play MP3/FLAC/M4A
background app
lock phone
control playback externally
receive a call
have music pause correctly
return and resume correctly
leave a track at 1:32
return later at 1:32
seek with timestamp tooltip
use queue/shuffle/repeat
use EQ/audio controls
use accessible visible controls
use gestures if desired
see synced lyrics when available
keep cached lyrics offline
get related-song suggestions by artist/genre
download only from permitted integrated sources
see download progress
find downloaded track correctly categorized
use home-screen widget
restart app without losing state
use app offline
export local backup
restore local backup
```

Release quality:

```text
Android signed AAB
Android installable release APK for QA
iOS archived release
TestFlight-ready build
release docs
privacy/security docs
no server music/history storage
no critical known bugs
no illegal provider enabled
no unresolved Telegram compliance blocker
all HANDOFF/status docs accurate
```

---

# 41. PRINCIPLE FOR CODEX

When choosing between:

```text
clever vs maintainable       -> maintainable
visual effect vs accessibility -> accessibility
abstraction vs duplication   -> useful abstraction
fast hack vs recoverable data -> recoverable data
hidden magic vs user control -> user control
JS workaround vs native media correctness -> native correctness
feature quantity vs reliable behavior -> reliable behavior
```

The app should look extraordinary because fundamentals are extraordinary.

Not because it has more blur.

Not because everything moves.

Not because every touch triggers an effect.

It should feel exceptional because:

```text
the library is instant
the player never loses state
Telegram import just works
controls feel physical
lyrics stay synchronized
background playback is reliable
calls behave correctly
files never disappear
the UI explains itself
advanced users have depth
new users never feel lost
privacy is real
```

That is the product.
