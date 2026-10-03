#!/usr/bin/env bash
set -euo pipefail

# Run from the workspace root after the CI simulator build.
artifact_dir="$PWD/artifacts/ios-smoke"
mkdir -p "$artifact_dir"
device_id="$(xcrun simctl list devices available --json | node -e 'let data="";process.stdin.on("data",x=>data+=x);process.stdin.on("end",()=>{const device=Object.values(JSON.parse(data).devices).flat().find(x=>x.isAvailable&&x.name.startsWith("iPhone"));if(!device)process.exit(1);process.stdout.write(device.udid);});')"
app_path="$PWD/app/ios/build/Build/Products/Debug-iphonesimulator/MusicPlayer.app"
bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app_path/Info.plist")"
metro_pid=''
cleanup() {
  if [[ -n "$metro_pid" ]]; then kill "$metro_pid" 2>/dev/null || true; fi
  xcrun simctl shutdown "$device_id" || true
}
trap cleanup EXIT

xcrun simctl boot "$device_id"
xcrun simctl bootstatus "$device_id" -b
pnpm --filter @music-player/app start --host 127.0.0.1 --port 8081 --max-workers 2 --no-interactive > "$artifact_dir/metro.log" 2>&1 &
metro_pid=$!
for attempt in {1..60}; do
  if curl --fail --silent http://127.0.0.1:8081/status | grep -q 'packager-status:running'; then break; fi
  if ! kill -0 "$metro_pid" 2>/dev/null; then cat "$artifact_dir/metro.log"; exit 1; fi
  sleep 2
done
curl --fail --silent http://127.0.0.1:8081/status | grep -q 'packager-status:running'
xcrun simctl install "$device_id" "$app_path"
xcrun simctl launch --stdout="$artifact_dir/app.stdout.log" --stderr="$artifact_dir/app.stderr.log" "$device_id" "$bundle_id"
# Allow the first Metro compilation to finish before collecting launch evidence.
sleep 45
xcrun simctl io "$device_id" screenshot "$artifact_dir/onboarding.png"
xcrun simctl spawn "$device_id" log show --last 2m --style compact --predicate 'process == "MusicPlayer"' > "$artifact_dir/native.log"
xcrun simctl spawn "$device_id" launchctl list > "$artifact_dir/launchctl.txt"
if ! grep -Fq "UIKitApplication:$bundle_id" "$artifact_dir/launchctl.txt"; then
  echo "App process exited before the smoke check" >&2
  exit 1
fi
if grep -E 'Unhandled JS Exception|RCTFatal|Invalid hook call|Terminating app due to uncaught exception|Application failed to launch' "$artifact_dir"/*.log; then
  exit 1
fi
result_bundle="$artifact_dir/foundation-ui-$(date +%Y%m%d%H%M%S).xcresult"
if ! xcodebuild \
  -workspace app/ios/MusicPlayer.xcworkspace \
  -scheme MusicPlayer \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$device_id" \
  -derivedDataPath app/ios/build \
  -resultBundlePath "$result_bundle" \
  -parallel-testing-enabled NO \
  CODE_SIGNING_ALLOWED=NO test > "$artifact_dir/foundation-ui.log" 2>&1; then
  echo "Foundation UI tests failed. Final xcodebuild output:" >&2
  tail -n 160 "$artifact_dir/foundation-ui.log" >&2
  if [[ -d "$result_bundle" ]] && xcrun xcresulttool get test-results summary --path "$result_bundle" > "$artifact_dir/foundation-summary.json" 2>/dev/null; then
    cat "$artifact_dir/foundation-summary.json" >&2
  fi
  while IFS= read -r failure; do
    failure="${failure//'%'/'%25'}"
    failure="${failure//$'\r'/'%0D'}"
    echo "::error title=iOS Foundation UI test::${failure:0:1000}"
  done < <(grep -E 'error:|Test Case .* failed|Assertion Failure|Testing failed' "$artifact_dir/foundation-ui.log" | tail -n 10 || true)
  exit 1
fi
echo "Simulator launch and Foundation UI test passed: $device_id / $bundle_id."
