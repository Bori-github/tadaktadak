#!/bin/sh
# 실기기 개발 빌드 설치 + Metro 실행. 현재 Mac IP·포트로 빌드
# 사용: sh scripts/run-device.sh <ios|android> [포트]
set -eu

PLATFORM=${1:-}
PORT=${2:-8081}

case "$PLATFORM" in
  ios | android) ;;
  *)
    echo "사용: sh scripts/run-device.sh <ios|android> [포트]" >&2
    exit 1
    ;;
esac

# 포트 점유 시 expo가 `--port`를 빌드에 반영하지 않음
PORT_OWNER=$(lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)
if [ -n "$PORT_OWNER" ]; then
  echo "포트 $PORT 사용 중: $(lsof -a -p "$PORT_OWNER" -d cwd -Fn | sed -n 's/^n//p')" >&2
  echo "다른 포트를 지정하거나 그 Metro를 종료" >&2
  exit 1
fi

android_serials() {
  # 무선 디버깅 시리얼에 공백이 있어 탭 구분
  adb devices | awk -F '\t' 'NR > 1 && $2 == "device" { print $1 }'
}

# 기기 없을 때 prebuild 대기 방지로 기기 먼저 확인
DEVICE=
if [ "$PLATFORM" = ios ]; then
  # `expo run:ios`는 CoreDevice 식별자가 아닌 하드웨어 UDID만 인식
  DEVICES_JSON=$(mktemp)
  xcrun devicectl list devices --json-output "$DEVICES_JSON" > /dev/null
  UDIDS=$(jq -r '.result.devices[] | select(.hardwareProperties.reality == "physical" and .connectionProperties.tunnelState == "connected") | .hardwareProperties.udid' "$DEVICES_JSON")
  rm -f "$DEVICES_JSON"

  if [ -z "$UDIDS" ]; then
    echo "연결된 iPhone 없음. Mac과 같은 Wi-Fi인지, 잠금이 풀렸는지 확인" >&2
    echo "처음 연결하면 Xcode > Devices and Simulators에서 Connect via network로 페어링" >&2
    exit 1
  fi

  # 2대 이상이면 expo 기기 선택 프롬프트
  [ "$(printf '%s\n' "$UDIDS" | grep -c .)" = 1 ] && DEVICE=$UDIDS
else
  SERIALS=$(android_serials)
  if [ -z "$SERIALS" ]; then
    # 무선 디버깅 포트가 바뀌므로 페어링된 기기를 mDNS로 탐색해 재연결
    adb mdns services | awk -F '\t' '$2 ~ /_adb-tls-connect/ { print $3 }' | while IFS= read -r ADDRESS; do
      adb connect "$ADDRESS" < /dev/null > /dev/null || true
    done
    SERIALS=$(android_serials)
  fi

  if [ -z "$SERIALS" ]; then
    echo "연결된 Android 기기 없음. 개발자 옵션 > 무선 디버깅이 켜졌는지, Mac과 같은 Wi-Fi인지 확인" >&2
    echo "처음 연결하면 adb pair <IP:페어링 포트> 후 adb connect <IP:포트>" >&2
    exit 1
  fi

  # 실기기는 `localhost:<포트>`로 번들을 요청해 기기마다 `adb reverse`
  printf '%s\n' "$SERIALS" | while IFS= read -r SERIAL; do
    adb -s "$SERIAL" reverse tcp:"$PORT" tcp:"$PORT" < /dev/null > /dev/null
  done
fi

# `expo run`은 기존 네이티브 폴더를 재생성하지 않아 설정·의존성 변경 시 prebuild
NATIVE_MARKER=ios/Podfile.lock
[ "$PLATFORM" = android ] && NATIVE_MARKER=android/settings.gradle
if [ ! -f "$NATIVE_MARKER" ] || [ -n "$(find app.json pnpm-lock.yaml -newer "$NATIVE_MARKER")" ]; then
  pnpm expo prebuild --platform "$PLATFORM" --clean
fi

if [ -n "$DEVICE" ]; then
  exec pnpm expo run:ios --device "$DEVICE" --port "$PORT"
fi
exec pnpm expo run:"$PLATFORM" --device --port "$PORT"
