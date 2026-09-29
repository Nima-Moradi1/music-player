# ADR-001: local-first, native-heavy React Native

Status: accepted from the implementation specification.

Use bare React Native 0.87.x with React 19, strict TypeScript, Hermes, and the New Architecture. Persist normalized library data in transactional SQLite and small settings in MMKV. Native adapters own long I/O, audio, TDLib, secure keys, and system surfaces.

Dependency direction: feature → domain interface ← infrastructure/native implementation. Composition occurs in app bootstrap. Feature screens never access raw native modules. Zustand holds ephemeral state; TanStack Query is reserved for optional remote providers.

No backend is created by default. No Expo-managed project or React Native Track Player. Telegram and DSP are explicitly deferred beyond the first session, and every phase remains gated on its tests and device checks.
