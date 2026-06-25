#!/usr/bin/env bash
set -euo pipefail

# Android SDK lives on Windows; this script wires WSL to it and runs a native build.
export ANDROID_HOME="/mnt/c/Users/bryan/AppData/Local/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="$HOME/.local/java/jdk-17.0.14+7"
export PATH="$HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$JAVA_HOME/bin:$PATH"

# Ensure adb exists (WSL needs a script; Windows only ships adb.exe).
ADB_WRAPPER="$ANDROID_HOME/platform-tools/adb"
if [[ ! -x "$ADB_WRAPPER" ]]; then
  printf '#!/bin/bash\nexec "$(dirname "$0")/adb.exe" "$@"\n' > "$ADB_WRAPPER"
  chmod +x "$ADB_WRAPPER"
fi

cd "$(dirname "$0")/.."

if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "$HOME/.nvm/nvm.sh"
  nvm use 22 >/dev/null
fi

echo "ANDROID_HOME=$ANDROID_HOME"
echo "Checking for devices..."
adb devices

AVDS="$("$ANDROID_HOME/emulator/emulator.exe" -list-avds 2>/dev/null || true)"
DEVICE_COUNT="$(adb devices | tail -n +2 | tr -d '\r' | grep -Ec '(^|\s)device$' || true)"

if [[ "$DEVICE_COUNT" -eq 0 && -z "$AVDS" ]]; then
  echo ""
  echo "No emulator found. Create one in Android Studio on Windows:"
  echo "  1. Open Android Studio"
  echo "  2. More Actions → Virtual Device Manager (or Tools → Device Manager)"
  echo "  3. Create Device → pick Pixel 6 → API 34 or 35 → Finish"
  echo "  4. Click the Play ▶ button to start the emulator"
  echo "  5. Run: npm run android:native"
  echo ""
  exit 1
fi

if [[ "$DEVICE_COUNT" -eq 0 && -n "$AVDS" ]]; then
  FIRST_AVD="$(echo "$AVDS" | head -1)"
  echo ""
  echo "No device running. Starting emulator: $FIRST_AVD"
  echo "(This may take a minute on first boot.)"
  "$ANDROID_HOME/emulator/emulator.exe" -avd "$FIRST_AVD" >/dev/null 2>&1 &
  adb wait-for-device
  echo "Emulator ready."
fi

npx expo run:android "$@"
