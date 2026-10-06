#!/bin/sh
# Test Cases: TC-NOTIFICATION-004, TC-NOTIFICATION-005, TC-NOTIFICATION-006, TC-NOTIFICATION-007
# 소요 시간: 5분
# 주의사항:
# - 벨소리 모드를 진동/무음으로 설정하고 끝나면 원래 모드로 복원
# - TC-NOTIFICATION-006의 진동 체감은 기기를 들고 수동 확인(y/n 입력)
. "$(dirname "$0")/lib.sh"

# $1 벨소리 모드, $2 TC ID, $3 진동 체감 수동 확인(1)
foreground() {
  set_ringer "$1"
  start_idle
  since=$(now_stamp)
  tap controls-play
  start=$(now_epoch)
  wait_until_epoch $((start + FOCUS_DONE))
  vibrations=$(vibrations_since "$since")
  ok=0
  echo "$vibrations" | grep -q '^app MEDIA' || ok=1
  [ "$(count_completions)" = 0 ] || ok=1
  [ "$(sounds_since "$since")" = 0 ] || ok=1
  if [ "${3:-0}" = 1 ]; then ask "$2: 완료 시각에 진동이 느껴졌는가" || ok=1; fi
  report "$2" $ok "벨소리 모드 $(ringer), 앱 진동 $(echo "$vibrations" | grep -c '^app MEDIA'), 완료 알림 $(count_completions), 소리 $(sounds_since "$since")"
  tap controls-stop
}

# $1 벨소리 모드, $2 TC ID, $3 기대 알림 진동 여부(1 있음, 0 없음)
background() {
  set_ringer "$1"
  start_idle
  since=$(now_stamp)
  tap controls-play
  start=$(now_epoch)
  go_home
  wait_until_epoch $((start + FOCUS_DONE))
  vibrations=$(vibrations_since "$since")
  has_vibration=$(echo "$vibrations" | grep -q '^notification NOTIFICATION' && echo 1 || echo 0)
  ok=0
  [ "$(count_notifications vibration)" -ge 1 ] || ok=1
  [ "$has_vibration" = "$3" ] || ok=1
  [ "$(sounds_since "$since")" = 0 ] || ok=1
  report "$2" $ok "벨소리 모드 $(ringer), vibration 채널 알림 $(count_notifications vibration), 알림 진동 $has_vibration, 소리 $(sounds_since "$since")"
  launch
  tap controls-stop
}

start_idle
set_vibration 1
foreground 1 TC-NOTIFICATION-004
background 1 TC-NOTIFICATION-005 1
prompt "TC-NOTIFICATION-006: 다음 1분 동안 기기를 들고 완료 진동을 확인"
foreground 0 TC-NOTIFICATION-006 1
background 0 TC-NOTIFICATION-007 0
