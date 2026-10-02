# iOS build and release

Current target/scheme: `MusicPlayer`; workspace created by CocoaPods: `app/ios/MusicPlayer.xcworkspace`. Minimum iOS 15.1. Bundle ID is the generated `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)` placeholder and must be finalized before release. There is no widget target or App Group yet.

## Simulator development on macOS

React Native's checked-in helper requires Xcode 16.1 or later; verify production App Store/Xcode requirements again at release time.

Use Ruby 3.3.12 (see the root `.ruby-version`), matching the iOS CI toolchain. With Homebrew, install Ruby 3.3 and select it in each terminal before running Bundler:

```sh
brew install ruby@3.3
export PATH="$(brew --prefix ruby@3.3)/bin:$PATH"
ruby -v
bundle -v
```

Ruby must report `3.3.x`. Homebrew's versioned Ruby is keg-only, so installation alone does not change the active Ruby. Add the export to your shell configuration if you want it in future terminals. If using a version manager, install and select the version in `.ruby-version` instead.

macOS's system Ruby 2.6 can fail while compiling `json` with `ruby/config.h` missing. Selecting the standalone Ruby fixes the missing development headers; the Gemfile rejects the unsupported system Ruby before installation. Bundler keeps gems in `app/vendor/bundle`, which is ignored by Git.

`app/Gemfile.lock` records the verified gems and Bundler version. CI reads that lockfile and installs with `BUNDLE_FROZEN=true` so dependency changes must be intentional. If your Ruby installation provides a different Bundler, install the locked version with `gem install bundler -v 4.0.16`.

For CocoaPods and simulator builds, use the full Xcode developer directory in the same terminal (adjust the path if Xcode is installed elsewhere):

```sh
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
xcodebuild -version
```

Then, from the repository root:

```sh
pnpm install --frozen-lockfile --fetch-timeout=600000
cd app
bundle install
cd ios
bundle exec pod install
xcodebuild -workspace MusicPlayer.xcworkspace -scheme MusicPlayer -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
```

From the repository root, `pnpm ios` starts the selected simulator; run Metro with `pnpm start`. Windows cannot execute Xcode. The macOS workflow executes the simulator build and `bash scripts/ios-simulator-smoke.sh` from the workspace root. The launch step installs the built app, starts Metro, captures onboarding/native logs, and shuts down its simulator and Metro process. Review the `ios-simulator-smoke` artifact for rendering; its current result is recorded in `HANDOFF.md`.

## Production gate — not completed

Choose the final bundle ID and Apple Developer team, set version/build, and verify signing/capabilities on a physical device. Add background audio when Phase 2 implements the native engine. Add WidgetKit/App Intents and App Group entitlements only with the Phase 4 widget. Package TDLib only in Phase 3; no Telegram credentials are currently bundled.

Audit `PrivacyInfo.xcprivacy`, required-reason APIs from all native dependencies, usage descriptions, deep links, native library architectures and symbol archives. Build Release, test on a device, then use Xcode Product → Archive and Organizer → Distribute App → TestFlight internal testing. The archive, signing, external TestFlight and App Store submission are not verified yet.

The system document picker grants selected-file access; the app copies into its private sandbox. Deleting the app removes local data unless the user has exported a backup (backup/restore remains a release-phase task).
