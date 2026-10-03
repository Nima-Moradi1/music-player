# Phase 4 — Advanced experience

Status: IN PROGRESS (local features only)
Source: `docs/IMPLEMENTATION_SPEC.md`, sections 15–17 and 27.
Gate: lyrics, discovery, permitted downloads, widgets and advanced player experience require their full provider/native/device evidence. Phase 3 remains open; local Phase 4 work started at the user's request.

### P4-T01 — Lyrics

Status: IN PROGRESS
Implemented: user-supplied plain/LRC lyrics saved per track in SQLite; timestamp parsing, binary-search active line from playback clock, and ±0.5-second saved timing offset. EN/FA Lyrics screen is accessible from track details. No lyrics leave the device.
Evidence: parser, real SQLite repository and screen tests pass locally; run 37124962862 passed iOS simulator build, launch and Foundation UI tests. Run 37125379473 passed the native build with iOS song-language metadata; its simulator smoke is still running.
Implemented since that pass: native import reads bounded iOS lyric metadata and Android MP3 ID3v2 USLT, caches it locally, and prefers later manual edits.
Open: device verification of embedded decoding and Android formats beyond MP3, approved online provider and rights gate, provider result selection, complete lyric scrolling/device accessibility checks. The user limited online lyrics to English, Spanish, German and Italian; all four have track language codes and manual choices. iOS reads the common song-language metadata tag during import; simulator smoke/device evidence for this change and Android language-tag extraction remain open. [Google's terms](https://policies.google.com/terms) do not grant an app a license to copy third-party full lyrics from Search, and its [Custom Search JSON API](https://developers.google.com/custom-search/v1/overview) is closed to new customers. No external lyrics are fetched.

### P4-T02 — Discovery

Status: IN PROGRESS
Implemented: bounded local-library suggestions ranked by shared artist, genre and album; Persian locale gets a small tie preference. The Discover tab shows the reason and opens stored songs. Unplayable fixture entries and title-only matches are excluded.
Evidence: ranking and SQLite-backed UI tests pass.
Implemented since the earlier pass: discovery queries bounded playable artist/genre/album matches directly from SQLite instead of taking the first 200 titles; a real SQLite case covers matches beyond that first page. A user-triggered MusicBrainz metadata search displays distinct recordings by the current artist, ranks available genre tags, rate limits requests and links to the source page. It never labels a recording as downloadable.
Open: [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API) commercial-use decision, wider source coverage, recommendation quality/device checks and explicit licenses for any audio offers.

### P4-T03 — Permitted downloads

Status: IN PROGRESS
Implemented: a disabled-by-default licensed offer/provider/transfer contract verifies offline-copy rights, provider identity, file bounds, short-lived HTTPS URL, free space and cancellation. It reuses managed import for validation, hash dedupe and `app_download` provenance, then cleans up adapter-owned temporary files.
Open: approved source with per-track offline-copy rights and attribution, resilient native transfer and UI/progress states. A public audio URL alone is not proof of these rights. No download provider is enabled.

### P4-T04 — Widgets and system surfaces

Status: TODO
Open: Android widget, iOS WidgetKit/App Intents, artwork/actions/deep links and device tests. Existing Android MediaSession and iOS Now Playing controls are Phase 2 foundations, not widgets.

### P4-T05 — Advanced EQ, gestures and visuals

Status: TODO
Open: cross-platform DSP/EQ capability, gesture editor, visualizer and accessibility/performance matrix. Playback speed is implemented under Phase 2; it does not close this task.
