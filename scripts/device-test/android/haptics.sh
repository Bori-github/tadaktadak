#!/bin/sh
# Test Cases: TC-SETTINGS-001, TC-SETTINGS-002, TC-SETTINGS-003, TC-SETTINGS-004, TC-SETTINGS-006, TC-SETTINGS-007
# 소요 시간: 4분
. "$(dirname "$0")/lib.sh"

# $1 TC ID, $2 기대 조작 진동 여부(1 있음, 0 없음)
button_tap() {
  since=$(now_stamp)
  sleep 1
  tap readout-focus
  sleep 1
  touches=$(vibrations_since "$since" | grep -c '^app TOUCH' || true)
  ok=0
  [ "$([ "$touches" -gt 0 ] && echo 1 || echo 0)" = "$2" ] || ok=1
  [ "$(sounds_since "$since")" = 0 ] || ok=1
  report "$1" $ok "버튼 터치 조작 진동 $touches, 소리 $(sounds_since "$since")"
}

# $1 TC ID, $2 기대 조작 진동 여부
# 손잡이를 잡지 못하면 진동도 없어 진동 없음 케이스가 통과로 보이므로 타이머 시간(분) 변경까지 확인
drag() {
  since=$(now_stamp)
  sleep 1
  drag_minutes 1 5
  touches=$(vibrations_since "$since" | grep -c '^app TOUCH' || true)
  sounds=$(sounds_since "$since")
  minutes=$(focus_minutes)
  ok=0
  [ "$minutes" = 5 ] || ok=1
  [ "$([ "$touches" -gt 0 ] && echo 1 || echo 0)" = "$2" ] || ok=1
  [ "$sounds" = 0 ] || ok=1
  report "$1" $ok "1분에서 5분으로 드래그 후 타이머 시간 ${minutes}분, 조작 진동 $touches, 소리 $sounds"
  drag_minutes 5 1
}

set_ringer 2
start_idle
set_vibration 1
button_tap TC-SETTINGS-004 1
drag TC-SETTINGS-003 1

set_vibration 0
button_tap TC-SETTINGS-007 0
drag TC-SETTINGS-006 0

since=$(now_stamp)
tap controls-play
start=$(now_epoch)
wait_until_epoch $((start + FOCUS_DONE))
vibrations=$(vibrations_since "$since")
ok=0
[ "$(count_notifications banner)" -ge 1 ] || ok=1
echo "$vibrations" | grep -q 'MEDIA\|NOTIFICATION' && ok=1
report TC-SETTINGS-001 $ok "포그라운드 완료 banner 채널 알림 $(count_notifications banner), 완료 진동 $(echo "$vibrations" | grep -c 'MEDIA\|NOTIFICATION')"
tap controls-stop

launch
since=$(now_stamp)
tap controls-play
start=$(now_epoch)
go_home
wait_until_epoch $((start + FOCUS_DONE))
vibrations=$(vibrations_since "$since")
ok=0
[ "$(count_notifications banner)" -ge 1 ] || ok=1
echo "$vibrations" | grep -q '^notification' && ok=1
report TC-SETTINGS-002 $ok "백그라운드 완료 banner 채널 알림 $(count_notifications banner), 알림 진동 $(echo "$vibrations" | grep -c '^notification')"
launch
tap controls-stop
set_vibration 1
