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

# `dumpsys` 결과에 서비스 머리글이 없으면 adb 실패로 보고 종료. 빈 결과가 「0개」로 판정되지 않도록 여기서 막음
dumpsys_checked() {
  header=$1
  shift
  out=$(device shell dumpsys "$@")
  case "$out" in
    *"$header"*) printf '%s\n' "$out" ;;
    *) echo "dumpsys $1 결과를 읽지 못함" >&2; exit 1 ;;
  esac
}

notification_dump() {
  dumpsys_checked "Current Notification Manager state" notification --noredact
}

# 앱 알림의 채널 이름. 한 줄에 하나
# 알림을 다시 게시하는 순간 같은 알림이 두 목록에 함께 나와 `key`로 중복 제거
notifications() {
  dump=$(notification_dump)
  printf '%s\n' "$dump" 2> /dev/null | awk -v pkg="$PACKAGE" '
    /NotificationRecord\(/ && index($0, "pkg=" pkg " ") {
      match($0, /key=[^ ]*/); key = substr($0, RSTART, RLENGTH)
      if (seen[key]++) next
      match($0, /channel=[a-z_-]*/); print substr($0, RSTART + 8, RLENGTH - 8)
    }'
}

count_notifications() {
  list=$(notifications)
  printf '%s\n' "$list" | grep -cx "$1" || true
}

# `since` 이후 이 앱의 진동. 한 줄에 경로(`app` 앱 직접, `notification` 알림)와 `Usage`
# 알림 진동은 다른 앱 것도 `opPkg: android`라 `reason`의 패키지 이름으로 구분
vibrations_since() {
  dump=$(dumpsys_checked "Vibrator Manager Service" vibrator_manager)
  printf '%s\n' "$dump" | grep "startTime: " | awk -v since="$1" -v pkg="$PACKAGE" '
    { split($0, a, "startTime: "); t = substr(a[2], 1, 14) }
    # 취소/무시된 진동은 재생되지 않아 제외. 확인 시점에 재생 중(`running`)인 진동은 포함
    t >= since && !index($0, "status: cancelled") && !index($0, "status: ignored") {
      match($0, /Usage=[A-Z_]+/); usage = substr($0, RSTART + 6, RLENGTH - 6)
      if (index($0, "opPkg: " pkg ",")) print "app", usage
      else if (index($0, "opPkg: android,") && index($0, "(" pkg " ")) print "notification", usage
    }'
}

# 실시간 업데이트 알림의 끝날 시각(밀리초). 남은 시간은 Skia로 그려 접근성 트리에 없어 이 값으로 확인
live_ends_at() {
  dump=$(notification_dump)
  printf '%s\n' "$dump" 2> /dev/null | awk -v pkg="$PACKAGE" '
    /NotificationRecord\(/ { on = index($0, "pkg=" pkg " ") && index($0, "channel=live-activity ") }
    on && /when=[0-9]+/ { sub(/.*when=/, ""); print; exit }'
}

# 실시간 업데이트 알림의 작은 아이콘 리소스 ID. 집중/휴식 타이머마다 다름
live_icon() {
  dump=$(notification_dump)
  printf '%s\n' "$dump" 2> /dev/null | awk -v pkg="$PACKAGE" '
    /NotificationRecord\(/ { on = index($0, "pkg=" pkg " ") && index($0, "channel=live-activity ") }
    on && /icon=Icon\(/ { match($0, /id=0x[0-9a-f]+/); print substr($0, RSTART + 3, RLENGTH - 3); exit }'
}

# `since` 이후 이 앱의 소리 재생 수. 앱 직접 재생은 오디오 로그의 앱 uid, 알림음은 `mSoundNotificationKey`로 확인
sounds_since() {
  uid=$(device shell dumpsys package "$PACKAGE" | grep -m1 -o 'userId=[0-9]*' | sed 's/userId=//')
  [ -n "$uid" ] || { echo "앱 uid를 읽지 못함" >&2; exit 1; }
  dump=$(dumpsys_checked "playback activity as reported through PlayerBase" audio)
  played=$(printf '%s\n' "$dump" 2> /dev/null | awk -v since="$1" -v uid="uid/pid:$uid/" '
    /playback activity as reported through PlayerBase/ { on = 1; next }
    on && /^$/ { on = 0 }
    on && substr($0, 1, 14) >= since && index($0, "new player") && index($0, uid) { n++ }
    END { print n + 0 }')
  dump=$(notification_dump)
  notification=$(printf '%s\n' "$dump" | grep -c "mSoundNotificationKey=.*$PACKAGE" || true)
  echo $((played + notification))
}

# 완료 알림 개수. 진동 토글에 따라 `vibration` 또는 `banner` 채널
count_completions() {
  echo $(($(count_notifications vibration) + $(count_notifications banner)))
}

# 진행 상태이면 진행 막대 갱신 알람과 완료 알림 알람이 예약됨
count_alarms() {
  dump=$(dumpsys_checked "Current Alarm Manager state" alarm)
  printf '%s\n' "$dump" | grep -c "Alarm{.* $PACKAGE}" || true
}

# 앱 창 `fl`의 `0x80`(`FLAG_KEEP_SCREEN_ON`) 비트
keep_screen_on() {
  fl=$(device shell dumpsys window windows | grep -A30 "$PACKAGE/" | grep -o ' fl=[0-9a-f]*' | head -1 | sed 's/ fl=//')
  [ -n "$fl" ] || { echo "앱 창 fl 값을 찾지 못함" >&2; exit 1; }
  [ $((0x$fl & 0x80)) -ne 0 ]
}

# 채널 알림 하나의 extras 값. 예: `notification_extra live-activity android.progress`
notification_extra() {
  dump=$(notification_dump)
  printf '%s\n' "$dump" 2> /dev/null | awk -v pkg="$PACKAGE" -v channel="channel=$1 " -v key="$2=" '
    /NotificationRecord\(/ { on = index($0, "pkg=" pkg " ") && index($0, channel) }
    on && index($0, key) { sub(/.*=[A-Za-z]+ \(/, ""); sub(/\)$/, ""); print; exit }'
}

# 실시간 업데이트 알림의 버튼 문구
live_action() {
  dump=$(notification_dump)
  printf '%s\n' "$dump" 2> /dev/null | awk -v pkg="$PACKAGE" '
    /NotificationRecord\(/ { on = index($0, "pkg=" pkg " ") && index($0, "channel=live-activity ") }
    on && /\[0\] "/ { sub(/.*\[0\] "/, ""); sub(/".*/, ""); print; exit }'
}

# 앱 채널 이름. 다른 앱의 같은 ID 채널을 읽지 않도록 이 앱의 `AppSettings` 블록 안에서만 조회
channel_name() {
  dump=$(notification_dump)
  printf '%s\n' "$dump" 2> /dev/null | awk -v pkg="AppSettings: $PACKAGE " -v id="mId='$1', mName=" '
    /AppSettings: / { on = index($0, pkg) > 0; next }
    on && index($0, id) { sub(/.*mName=/, ""); sub(/, mDescription=.*/, ""); print; exit }'
}

resumed_activity() {
  device shell dumpsys activity activities | grep -m1 topResumedActivity
}

# 대기 상태에서 숫자 터치 시 조작 진동이 기록되면 진동 토글 켜짐
vibration_enabled() {
  since=$(now_stamp)
  sleep 1
  tap readout-focus
  sleep 1
  vibrations_since "$since" | grep -q '^app TOUCH'
}

# 1 켜짐, 0 꺼짐
set_vibration() {
  current=$(vibration_enabled && echo 1 || echo 0)
  [ "$current" = "$1" ] && return
  tap settings
  tap settings-vibration
  tap modal-close
  current=$(vibration_enabled && echo 1 || echo 0)
  [ "$current" = "$1" ] || { echo "진동 토글을 $1(으)로 설정하지 못함" >&2; exit 1; }
  changed_vibration=$([ "$1" = 1 ] || echo 1)
}

# $1 언어 코드 또는 `system`
select_language() {
  tap settings
  tap settings-language
  tap "language-$1"
  tap modal-close
  changed_language=$([ "$1" = system ] || echo 1)
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

# 터미널이 없으면 질문을 출력하고 `$OUT/answer` 파일이 생길 때까지 대기. 에이전트가 대화창에서 받은 답을 이 파일에 씀
wait_answer() {
  if { : < /dev/tty; } 2> /dev/null; then
    printf '%s ' "$1" > /dev/tty
    read -r answer < /dev/tty
    return
  fi
  rm -f "$OUT/answer"
  echo "수동 확인: $1. 답변 파일 $OUT/answer"
  until [ -f "$OUT/answer" ]; do sleep 1; done
  answer=$(cat "$OUT/answer")
  rm -f "$OUT/answer"
}

# 수동 확인 단계. 입력을 받을 때까지 대기
prompt() {
  wait_answer "$1 (Enter)"
}

# 수동 확인 항목. y면 성공
ask() {
  wait_answer "$1 (y/n)"
  [ "$answer" = y ]
}

# `TC ID`, 결과(통과/불일치), 근거를 탭 문자(`\t`)로 구분해 한 줄 출력. Test Run 행으로 옮기는 단위
report() {
  printf '%s\t%s\t%s\n' "$1" "$([ "$2" = 0 ] && echo 통과 || echo 불일치)" "$3"
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
