# Phase 4 — Advanced experience

Status: IN PROGRESS (local features and limited open catalog)
Source: `docs/IMPLEMENTATION_SPEC.md`, sections 15–17 and 27.
Gate: lyrics, discovery, permitted downloads, widgets and advanced player experience require their full provider/native/device evidence. Phase 3 remains open; local Phase 4 work started at the user's request.

### P4-T01 — Lyrics

Status: IN PROGRESS
Implemented: user-supplied plain/LRC lyrics saved per track in SQLite; timestamp parsing, binary-search active line from playback clock, and ±0.5-second saved timing offset. EN/FA Lyrics screen is accessible from track details. Online lookup is user-triggered.
Evidence: parser, real SQLite repository and screen tests pass locally; runs 37124962862 and 37125379473 passed iOS simulator build, launch and Foundation UI tests, including the newer song-language metadata change.
Implemented since that pass: native import reads bounded iOS lyric metadata and Android MP3 ID3v2 USLT, caches it locally, and prefers later manual edits.
Implemented since then: user-triggered [Wikisource](https://en.wikisource.org/wiki/Wikisource:Copyright_policy) lookup for English, Spanish, German and Italian retrieves bounded plain-text extracts, filters candidates by title and lets the user select the matching work. The page is linked and named beside the text. Coverage is limited by source availability; results are displayed transiently and are not silently copied into the local lyrics cache. [Google's terms](https://policies.google.com/terms) do not grant an app permission to copy arbitrary Search lyrics.
Open: device verification of embedded decoding and Android formats beyond MP3, source-work rights review for release, complete lyric scrolling/device accessibility checks and physical-device evidence.

### P4-T02 — Discovery

Status: IN PROGRESS
Implemented: bounded local-library suggestions ranked by shared artist, genre and album; Persian locale gets a small tie preference. The Discover tab shows the reason and opens stored songs. Unplayable fixture entries and title-only matches are excluded.
Evidence: ranking and SQLite-backed UI tests pass.
Implemented since the earlier pass: discovery queries bounded playable artist/genre/album matches directly from SQLite instead of taking the first 200 titles; a real SQLite case covers matches beyond that first page. A user-triggered MusicBrainz metadata search displays distinct recordings by the current artist, ranks available genre tags, rate limits requests and links to the source page. It never labels a recording as downloadable.
Open: [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API) commercial-use decision and recommendation quality/device checks. MusicBrainz remains metadata only; licensed audio offers use Commons independently.

### P4-T03 — Permitted downloads

Status: IN PROGRESS
Implemented: user-triggered Wikimedia Commons search accepts supported MP3/FLAC/M4A/AAC results only when the file metadata names a supported CC0/CC BY/CC BY-SA license, license URL and author. The provider rechecks rights, metadata and size immediately before transfer. iOS streams from Wikimedia's HTTPS upload host into bounded private temporary storage, then reuses managed import for format validation, hash dedupe and cleanup. A database migration stores provider, item, source page, author and license URL; track details present the attribution. Focused provider and contract tests pass. [Commons reuse guidance](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) still requires reviewing each file's information.
Open: iOS native CI/device transfer evidence, transfer progress percentage and Android transfer (deferred by the user). Limited catalog coverage is accepted, so no broader provider is required for this scope.

### P4-T04 — Widgets and system surfaces

Status: TODO
Open: Android widget, iOS WidgetKit/App Intents, artwork/actions/deep links and device tests. Existing Android MediaSession and iOS Now Playing controls are Phase 2 foundations, not widgets.

### P4-T05 — Advanced EQ, gestures and visuals

Status: TODO
Open: cross-platform DSP/EQ capability, gesture editor, visualizer and accessibility/performance matrix. Playback speed is implemented under Phase 2; it does not close this task.
