#!/bin/sh
# 완료 알림의 채널·진동을 벨소리 모드 × 진동 사용 여부 × 앱 상태 12가지 조합으로 실기기 검증
# 전제: Android 개발 빌드 설치, Metro 실행, 기기 잠금 해제
# 사용: sh scripts/check-android-notifications.sh [기기 시리얼]. CAPTURE=1이면 완료 시각 전후 화면을 OUT에 저장
set -eu

PACKAGE=com.boriguri.tadaktadak
SERIAL=${1:-$(adb devices | awk 'NR > 1 && $2 == "device" { print $1; exit }')}
OUT=${OUT:-$(mktemp -d)}
CAPTURE=${CAPTURE:-0}
# `IAudioService$Stub` 트랜잭션 번호. Galaxy S20+ Android 12 `framework.jar` 기준. 기기·OS 버전에 따라 값이 다름
GET_RINGER=34
SET_RINGER=32

[ -n "$SERIAL" ] || { echo "연결된 기기 없음" >&2; exit 1; }

device() {
  adb -s "$SERIAL" "$@"
}

ringer() {
  device shell service call audio "$GET_RINGER" | sed -E 's/.*00000000 0000000([0-2]).*/\1/'
}

set_ringer() {
  device shell service call audio "$SET_RINGER" i32 "$1" s16 com.android.shell > /dev/null
}

dump_ui() {
  device shell uiautomator dump /sdcard/check-ui.xml > /dev/null
  device shell cat /sdcard/check-ui.xml > "$OUT/ui.xml"
}

# `testID`가 `resource-id`로 노출되므로 UI 계층에서 bounds 중심점 계산
center() {
  grep -o "resource-id=\"$1\"[^>]*bounds=\"[^\"]*\"" "$OUT/ui.xml" | sed -E 's/.*\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"$/\1 \2 \3 \4/' | awk '{ print int(($1 + $3) / 2), int(($2 + $4) / 2) }'
}

wait_for() {
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    dump_ui
    [ -n "$(center "$1")" ] && return
    sleep 1
  done
  echo "화면에서 $1 을 찾지 못함" >&2
  exit 1
}

# 스플래시가 표시되는 동안 탭 입력이 차단되므로 해당 요소가 사라질 때까지 대기
wait_until_gone() {
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    dump_ui
    [ -z "$(center "$1")" ] && return
    sleep 1
  done
  echo "$1 이 사라지지 않음" >&2
  exit 1
}

launch() {
  device shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  wait_for controls-play
  wait_until_gone splash
}

# 기기가 앱별 알림을 25개까지만 보관하므로 조합마다 앱 데이터를 초기화해 알림 제거
# 초기화 후 한 번 실행해 저장소를 생성하고 타이머 시간·진동 사용 여부 기록
prepare_app() {
  device shell pm clear "$PACKAGE" > /dev/null
  launch
  device shell am force-stop "$PACKAGE"
  device exec-out run-as "$PACKAGE" cat databases/RKStorage > "$OUT/rk.db"
  sqlite3 "$OUT/rk.db" "insert or replace into catalystLocalStorage (key, value) values ('timer.minutes.focus', '1'), ('timer.minutes.rest', '1'), ('vibrationEnabled', '$1');"
  device exec-in run-as "$PACKAGE" sh -c 'cat > databases/RKStorage' < "$OUT/rk.db"
  device shell run-as "$PACKAGE" rm -f databases/RKStorage-journal
  launch
}

tap() {
  # shellcheck disable=SC2046
  device shell input tap $(center "$1")
}

# 앱이 예약한 알람 중 가장 이른 시각(HHMMSS)
alarm_time() {
  device shell dumpsys alarm | grep -A2 "$PACKAGE}" | grep -o 'origWhen=[0-9-]* [0-9:]*' | head -1 | sed -E 's/.* //; s/://g'
}

# 앱 알림 목록. 줄마다 채널과 무음 알림 여부
notifications() {
  device shell dumpsys notification --noredact | awk -v pkg="$PACKAGE" '
    /NotificationRecord\(/ && index($0, "pkg=" pkg " ") { match($0, /channel=[a-z_-]*/); print substr($0, RSTART + 8, RLENGTH - 8), (index($0, "groupKey=silent") ? "yes" : "no") }'
}

# `since`(MM-DD HH:MM:SS) 이후 진동. 앱 완료 진동은 `app`, 시스템 알림 진동은 `system`
# 조작 진동(5ms)은 버튼 탭마다 발생하므로 제외
vibrations_since() {
  device shell dumpsys vibrator_manager | grep "startTime: " | awk -v since="$1" -v pkg="$PACKAGE" '
    { split($0, a, "startTime: "); t = substr(a[2], 1, 14) }
    t >= since && index($0, "opPkg: " pkg ",") && (index($0, "duration=60}") || index($0, "duration=900}")) { print "app" }
    t >= since && index($0, "opPkg: android,") && index($0, "TYPE_NOTIFICATION") { print "system" }'
}

# 조합별 기대값. 무음 모드는 시스템이 알림 진동을 차단
expected() {
  mode=$1 vibration=$2 state=$3
  if [ "$vibration" = true ] && [ "$state" = foreground ]; then
    echo "channel= vib=app"
  elif [ "$vibration" = true ] && [ "$mode" = 0 ]; then
    echo "channel=vibration vib="
  elif [ "$vibration" = true ]; then
    echo "channel=vibration vib=system"
  else
    echo "channel=banner vib="
  fi
}

run_case() {
  mode=$1 vibration=$2 state=$3
  set_ringer "$mode"
  prepare_app "$vibration"
  # 10배속에서 1분은 6초. 50배속(1.2초)은 알람 조회 전에 전달되어 끝날 시각 조회 불가
  tap speed-10x
  # `adb shell`이 인자를 공백으로 결합하므로 형식 문자열을 한 인자로 전달
  since=$(device shell "date '+%m-%d %H:%M:%S'" | tr -d '\r')
  tap controls-play
  end=
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    end=$(alarm_time)
    [ -n "$end" ] && break
  done
  [ -n "$end" ] || { echo "예약된 알람을 찾지 못함" >&2; exit 1; }
  [ "$state" = background ] && device shell input keyevent KEYCODE_HOME
  until [ "$(device shell date '+%H%M%S')" -ge "$end" ]; do sleep 0.2; done
  if [ "$CAPTURE" = 1 ]; then
    for i in 1 2 3 4 5 6; do device exec-out screencap -p > "$OUT/mode$mode-$vibration-$state-$i.png"; done
  fi
  sleep 2

  posted=$(notifications)
  channel=$(echo "$posted" | awk 'NR == 1 { print $1 }')
  silent=$(echo "$posted" | grep -q ' yes$' && echo yes || echo no)
  actual="channel=$channel vib=$(vibrations_since "$since" | sort -u | tr '\n' ' ' | sed 's/ $//')"
  result=$([ "$actual" = "$(expected "$mode" "$vibration" "$state")" ] && [ "$silent" = no ] && echo PASS || echo FAIL)
  printf '%-4s %-4s %-5s %-10s %-34s %s\n' "$result" "$mode" "$vibration" "$state" "$actual" "$silent"
}

device shell service call audio "$GET_RINGER" | grep -q 'Result: Parcel(00000000 0000000[0-2]' || { echo "벨소리 모드 읽기 실패. 트랜잭션 번호 확인 필요" >&2; exit 1; }
device exec-out run-as "$PACKAGE" true || { echo "run-as 불가. 개발 빌드 필요" >&2; exit 1; }

original_ringer=$(ringer)
original_stay_on=$(device shell settings get global stay_on_while_plugged_in)
restore() {
  set_ringer "$original_ringer"
  device shell settings put global stay_on_while_plugged_in "$original_stay_on"
}
# 비정상 종료 시에도 벨소리 모드·화면 켜짐 설정 복원
trap restore EXIT
# 화면 꺼짐 시 탭이 실패하므로 충전 중 화면 켜짐 유지
device shell svc power stayon usb

echo "결과 모드(0 무음·1 진동·2 소리) 진동 앱상태 실제 무음알림"
for mode in 2 1 0; do
  for vibration in true false; do
    for state in foreground background; do
      run_case "$mode" "$vibration" "$state"
    done
  done
done

device shell pm clear "$PACKAGE" > /dev/null
echo "앱 데이터를 초기화했음. 타이머 시간과 진동 사용 여부는 기본값"
[ "$CAPTURE" = 1 ] && echo "캡처: $OUT"
