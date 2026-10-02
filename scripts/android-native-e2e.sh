#!/usr/bin/env bash
set -euo pipefail

# Requires a booted disposable emulator. The Python runner refuses physical devices.
artifact_dir="$PWD/artifacts/android-e2e"
mkdir -p "$artifact_dir"
serial="${ANDROID_SERIAL:-$(adb devices | awk '/^emulator-.*device$/ {print $1; exit}')}"
if [[ -z "$serial" ]]; then echo 'No booted Android emulator found' >&2; exit 1; fi
metro_pid=''
cleanup() {
  if [[ -n "$metro_pid" ]]; then kill "$metro_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT

if ! curl --fail --silent http://127.0.0.1:8081/status | grep -q 'packager-status:running'; then
  pnpm --filter @music-player/app start --host 127.0.0.1 --port 8081 --max-workers 2 --no-interactive > "$artifact_dir/metro.log" 2>&1 &
  metro_pid=$!
  for attempt in {1..60}; do
    if curl --fail --silent http://127.0.0.1:8081/status | grep -q 'packager-status:running'; then break; fi
    if ! kill -0 "$metro_pid" 2>/dev/null; then cat "$artifact_dir/metro.log"; exit 1; fi
    sleep 2
  done
fi
curl --fail --silent http://127.0.0.1:8081/status | grep -q 'packager-status:running'
python3 scripts/android-e2e.py --serial "$serial" --apk "${ANDROID_E2E_APK:-app/android/app/build/outputs/apk/debug/app-debug.apk}" --artifacts "$artifact_dir"
