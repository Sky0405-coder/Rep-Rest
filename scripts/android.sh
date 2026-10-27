#!/usr/bin/env bash
# Startet bei Bedarf den Emulator, baut die App und installiert sie.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/env.sh

if ! avdmanager list avd -c 2>/dev/null | grep -qx "$WORKOUT_AVD"; then
  echo "Lege Emulator $WORKOUT_AVD an …"
  echo no | avdmanager create avd -n "$WORKOUT_AVD" -k "system-images;android-35;google_apis;x86_64" -d pixel_7 --force
fi

if ! adb devices | awk 'NR > 1 && $2 == "device"' | grep -q .; then
  echo "Starte Emulator …"
  nohup emulator -avd "$WORKOUT_AVD" -no-snapshot-save -no-boot-anim >/tmp/workout-emulator.log 2>&1 &
  adb wait-for-device
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
fi

pnpm --filter mobile android "$@"
