# Phase 4 — Advanced experience

Status: IN PROGRESS (local features only)
Source: `docs/IMPLEMENTATION_SPEC.md`, sections 15–17 and 27.
Gate: lyrics, discovery, permitted downloads, widgets and advanced player experience require their full provider/native/device evidence. Phase 3 remains open; local Phase 4 work started at the user's request.

### P4-T01 — Lyrics

Status: IN PROGRESS
Implemented: user-supplied plain/LRC lyrics saved per track in SQLite; timestamp parsing, binary-search active line from playback clock, and ±0.5-second saved timing offset. EN/FA Lyrics screen is accessible from track details. No lyrics leave the device.
Evidence: parser, real SQLite repository and screen tests pass in the 59-test suite; iOS 27 simulator Debug build and three UI smoke tests pass.
Open: native embedded lyrics extraction, approved online provider and rights gate, provider result selection, complete lyric scrolling/device accessibility checks. No external lyrics are fetched.

### P4-T02 — Discovery

Status: IN PROGRESS
Implemented: bounded local-library suggestions ranked by shared artist, genre and album; Persian locale gets a small tie preference. The Discover tab shows the reason and opens stored songs. Unplayable fixture entries and title-only matches are excluded.
Evidence: ranking and SQLite-backed UI tests pass.
Open: licensed provider adapters, wider-library paging and recommendation quality/device checks. No remote recommendations or download claims.

### P4-T03 — Permitted downloads

Status: TODO
Open: approved provider contract, legal capability and rights gate, resilient native transfer and validated managed import. No provider is enabled.

### P4-T04 — Widgets and system surfaces

Status: TODO
Open: Android widget, iOS WidgetKit/App Intents, artwork/actions/deep links and device tests. Existing Android MediaSession and iOS Now Playing controls are Phase 2 foundations, not widgets.

### P4-T05 — Advanced EQ, gestures and visuals

Status: TODO
Open: cross-platform DSP/EQ capability, gesture editor, visualizer and accessibility/performance matrix. Playback speed is implemented under Phase 2; it does not close this task.
