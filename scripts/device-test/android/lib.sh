#!/bin/sh
# 실기기 테스트 공통 함수. 케이스 스크립트에서 `.`으로 불러 씀
# 전제: Play 내부 테스트 설치본, 집중/휴식 타이머 1분, 진동 토글 켜짐, 알림 권한 허용, 시스템 언어 한국어, 보안 잠금(PIN/패턴) 없음
# 결과 확인 기준은 `TESTS.md` 「결과 확인」
set -eu

PACKAGE=com.boriguri.tadaktadak
SERIAL=${SERIAL:-$(adb devices | awk 'NR > 1 && $2 == "device" { print $1; exit }')}
OUT=${OUT:-$(mktemp -d)}
# `IAudioService$Stub` 트랜잭션 번호. Galaxy S20+ Android 13 기준. 기기/OS 변경 시 `TESTS.md` 「기능 번호 확인」으로 다시 확인
SET_RINGER=34
GET_RINGER=36
# 시계판 중심에서 손잡이까지 거리(px). Galaxy S20+ 측정 시 300~420에서 손잡이가 잡혀 가운데 값 사용
DIAL_RADIUS=${DIAL_RADIUS:-360}
# 타이머 시작 시각부터 결과를 확인할 때까지 기다리는 초. 집중/휴식 타이머 1분 전제에 완료 처리 여유 3초
FOCUS_DONE=63
REST_DONE=123

[ -n "$SERIAL" ] || { echo "연결된 기기 없음" >&2; exit 1; }

device() {
  adb -s "$SERIAL" "$@"
}

# 0 무음, 1 진동, 2 소리
ringer() {
  device shell service call audio "$GET_RINGER" | sed -E 's/.*00000000 0000000([0-2]).*/\1/'
}

set_ringer() {
  device shell service call audio "$SET_RINGER" i32 "$1" s16 com.android.shell > /dev/null
  [ "$(ringer)" = "$1" ] || { echo "벨소리 모드를 $1(으)로 설정하지 못함" >&2; exit 1; }
}

# 덤프 실패 시 이전 화면 파일을 읽지 않도록 먼저 삭제
dump_ui() {
  device shell rm -f /sdcard/device-test-ui.xml
  device shell uiautomator dump /sdcard/device-test-ui.xml > /dev/null
  device shell cat /sdcard/device-test-ui.xml > "$OUT/ui.xml"
}

# 화면 덤프에서 $1 속성을 가진 첫 요소의 bounds 중심점
center_of() {
  grep -o "$1[^>]*bounds=\"[^\"]*\"" "$OUT/ui.xml" | head -1 | sed -E 's/.*\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"$/\1 \2 \3 \4/' | awk '{ print int(($1 + $3) / 2), int(($2 + $4) / 2) }'
}

# `testID`가 `resource-id`로 노출됨
center() {
  center_of "resource-id=\"$1\""
}

# 정지 버튼 비활성이면 대기 상태. Android 접근성 트리에는 `remaining-seconds`가 없음
is_idle() {
  dump_ui
  grep -q 'resource-id="controls-stop"[^>]*enabled="false"' "$OUT/ui.xml"
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

# 스플래시가 표시되는 동안 터치 입력이 차단되어 사라질 때까지 대기
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
  device shell input keyevent KEYCODE_WAKEUP
  device shell wm dismiss-keyguard
  device shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 > /dev/null 2>&1
  wait_for controls-play
  wait_until_gone splash
}

# 최근 앱 화면에서 앱 카드를 위로 드래그해 앱 종료. `am force-stop`과 달리 예약 알람과 알림 유지
# 카드 중심 좌표를 `card`에 남겨 `swipe_card`가 화면 덤프 없이 다시 씀
close_app() {
  device shell input keyevent KEYCODE_APP_SWITCH
  sleep 2
  dump_ui
  card=$(center_of 'content-desc="타닥타닥"')
  [ -n "$card" ] || { echo "최근 앱 화면에서 앱 카드를 찾지 못함" >&2; exit 1; }
  swipe_card
}

# 최근 앱 화면의 `card` 좌표를 위로 드래그하고 최근 앱 목록에서 앱 작업이 사라졌는지 확인
# 진행 상태에서는 예약 알람이 앱 프로세스를 다시 띄워 프로세스 유무로 판정하지 않음
swipe_card() {
  # shellcheck disable=SC2086
  set -- $card
  device shell input swipe "$1" "$2" "$1" 50 500
  sleep 2
  go_home
  if device shell dumpsys activity recents | grep -q "A=[0-9]*:$PACKAGE "; then
    echo "최근 앱 목록에 앱이 남아 있음" >&2
    exit 1
  fi
}

# 손잡이를 $1분 위치에서 $2분 위치로 드래그. 시계판 중심은 `readout-focus` 터치 영역의 중심과 같음
drag_minutes() {
  wait_for readout-focus
  # shellcheck disable=SC2046
  set -- "$1" "$2" $(center readout-focus)
  # shellcheck disable=SC2046
  device shell input swipe $(dial_point "$3" "$4" "$1") $(dial_point "$3" "$4" "$2") 800
  sleep 1
  changed_minutes=$([ "$2" = 1 ] || echo 1)
}

# 중심 x, y에서 $3분 방향으로 `DIAL_RADIUS`만큼 떨어진 좌표. 12시가 0분
dial_point() {
  awk -v cx="$1" -v cy="$2" -v r="$DIAL_RADIUS" -v m="$3" 'BEGIN { a = (m * 6 - 90) * 3.14159265 / 180; printf "%d %d", cx + r * cos(a), cy + r * sin(a) }'
}

# 집중 타이머 시간(분). Skia로 그려 화면에서 읽지 못해 타이머를 잠시 시작해 실시간 업데이트 알림 제목으로 확인
focus_minutes() {
  tap controls-play
  sleep 2
  minutes=$(notification_extra live-activity android.title | grep -Eo '^[0-9]+' || true)
  tap controls-stop
  sleep 1
  [ -n "$minutes" ] || { echo "실시간 업데이트 알림에서 타이머 시간을 읽지 못함" >&2; exit 1; }
  echo "$minutes"
}

tap() {
  wait_for "$1"
  # shellcheck disable=SC2046
  device shell input tap $(center "$1")
}

now_epoch() {
  device shell date +%s | tr -d '\r'
}

# `dumpsys vibrator_manager`의 `startTime` 형식(MM-DD HH:MM:SS)
now_stamp() {
  device shell "date '+%m-%d %H:%M:%S'" | tr -d '\r'
}

# adb 연결이 끊겨 시각을 읽지 못하면 무한 반복하지 않고 종료
wait_until_epoch() {
  while now=$(now_epoch) && [ -n "$now" ]; do
    [ "$now" -ge "$1" ] && return
    sleep 1
  done
  echo "기기 시각을 읽지 못함" >&2
  exit 1
}

# 앱을 실행하고 타이머가 진행/일시정지 상태이면 정지
start_idle() {
  launch
  is_idle || { tap controls-stop; sleep 1; }
}

# 실행 직후 홈 화면으로 보내 백그라운드에서 완료되게 함
go_home() {
  device shell input keyevent KEYCODE_HOME
}

original_ringer=$(ringer)
original_stay_on=$(device shell settings get global stay_on_while_plugged_in | tr -d '\r')
# 스크립트가 바꾼 설정을 전제 조건(타이머 1분, 진동 토글 켜짐, 시스템 언어)으로 되돌림
# 단계마다 서브셸에서 실행해 앞 단계가 실패해도(`exit`) 다음 단계를 계속 진행
restore() {
  set +e
  [ -z "${changed_minutes:-}" ] || (start_idle && minutes=$(focus_minutes) && drag_minutes "$minutes" 1)
  [ -z "${changed_vibration:-}" ] || (start_idle && set_vibration 1)
  [ -z "${changed_language:-}" ] || (start_idle && select_language system)
  (set_ringer "$original_ringer")
  device shell settings put global stay_on_while_plugged_in "$original_stay_on"
}
# 비정상 종료 시에도 바꾼 설정 복원
trap restore EXIT
# 화면 꺼짐 시 터치가 실패하므로 화면 켜짐 유지. 무선 연결은 충전 중이 아닐 수 있어 전원과 무관하게 적용
device shell svc power stayon true
