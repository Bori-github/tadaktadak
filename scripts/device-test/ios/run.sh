#!/bin/sh
# Test Cases: TC-TIMER-018, TC-TIMER-020
# 전제: 개발 빌드 설치본, 알림 권한 허용, 시스템 언어 한국어, 기기 잠금 해제 상태
# 주의사항:
# - 테스트 전에 집중/휴식 타이머를 1분으로 저장
# - `REINSTALL=1`이면 앱 데이터를 삭제하고 `APP`(.app 경로, 기본은 마지막 개발 빌드)을 다시 설치한 뒤 TC-TIMER-018만 실행
#   재설치 후 첫 실행에 알림 권한 요청이 표시되어 TC-TIMER-020은 제외
set -eu

DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$DIR/../../.." && pwd)
OUT=${OUT:-$(mktemp -d)}
# 사용 가능한 첫 iOS 기기. 꺼졌거나 연결되지 않은 기기는 `tunnelState`가 `unavailable`
if [ -z "${UDID:-}" ]; then
  xcrun devicectl list devices --json-output "$OUT/devices.json" --quiet > /dev/null 2>&1 || true
  UDID=$(node -e 'const { devices = [] } = require(process.argv[1]).result ?? {}; const device = devices.find((d) => d.hardwareProperties.platform === "iOS" && d.connectionProperties.tunnelState !== "unavailable"); console.log(device?.hardwareProperties.udid ?? "")' "$OUT/devices.json" 2> /dev/null || true)
fi
TEAM=${DEVELOPMENT_TEAM:-$(sed -n 's/^EXPO_APPLE_TEAM_ID=//p' "$ROOT/.env" 2> /dev/null)}

[ -n "$UDID" ] || { echo "연결된 iOS 기기 없음" >&2; exit 1; }
[ -n "$TEAM" ] || { echo "DEVELOPMENT_TEAM 또는 .env의 EXPO_APPLE_TEAM_ID 필요" >&2; exit 1; }

ONLY=
if [ "${REINSTALL:-}" = 1 ]; then
  APP=${APP:-$(ls -td "$HOME"/Library/Developer/Xcode/DerivedData/TadakTadak-*/Build/Products/Debug-iphoneos/TadakTadak.app 2> /dev/null | head -1)}
  [ -d "$APP" ] || { echo "설치할 .app 없음. APP 환경 변수로 지정" >&2; exit 1; }
  xcrun devicectl device uninstall app --device "$UDID" com.boriguri.tadaktadak > /dev/null
  xcrun devicectl device install app --device "$UDID" "$APP" > /dev/null
  ONLY=-only-testing:TadakTadakUITests/ShortcutUITests/test1ShortcutDisplay
else
  E2E_DEVICE_ID="$UDID" node "$ROOT/scripts/set-e2e-timer-minutes.mjs" --platform ios-device > /dev/null
fi

# 테스트 실패도 결과 줄로 보고하므로 종료 코드 대신 출력으로 판정
# shellcheck disable=SC2086
xcodebuild test \
  -project "$DIR/TadakTadakUITests.xcodeproj" \
  -scheme TadakTadakUITests \
  -destination "id=$UDID" \
  $ONLY \
  -allowProvisioningUpdates \
  -resultBundlePath "$OUT/result.xcresult" \
  DEVELOPMENT_TEAM="$TEAM" > "$OUT/xcodebuild.log" 2>&1 || true

# 파이프라인 종료 코드는 마지막 명령 기준이라 `grep` 결과를 파일로 받아 판정
grep '^REPORT	' "$OUT/xcodebuild.log" > "$OUT/report.tsv" || { echo "결과 없음. 로그: $OUT/xcodebuild.log" >&2; exit 1; }
cut -f2- "$OUT/report.tsv"
