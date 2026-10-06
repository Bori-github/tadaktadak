#!/bin/sh
# Test Cases: TC-TIMER-001, TC-TIMER-002, TC-TIMER-003, TC-TIMER-004, TC-TIMER-005, TC-TIMER-006, TC-NOTIFICATION-001
# 소요 시간: 5분
. "$(dirname "$0")/lib.sh"

set_ringer 2
start_idle
set_vibration 1

since=$(now_stamp)
tap controls-play
start=$(now_epoch)
sleep 3
ok=0
[ "$(count_notifications live-activity)" = 1 ] || ok=1
report TC-TIMER-001 $ok "실시간 업데이트 알림 $(count_notifications live-activity)개"

wait_until_epoch $((start + FOCUS_DONE))
vibrations=$(vibrations_since "$since")
ok=0
echo "$vibrations" | grep -q '^app MEDIA' || ok=1
[ "$(count_completions)" = 0 ] || ok=1
[ "$(count_notifications live-activity)" = 1 ] || ok=1
report TC-TIMER-002 $ok "앱 진동 $(echo "$vibrations" | grep -c '^app MEDIA'), 완료 알림 $(count_completions), 실시간 업데이트 알림 $(count_notifications live-activity)"

since=$(now_stamp)
wait_until_epoch $((start + REST_DONE))
vibrations=$(vibrations_since "$since")
ok=0
echo "$vibrations" | grep -q '^app TOUCH' || ok=1
[ "$(count_completions)" = 0 ] || ok=1
[ "$(count_notifications live-activity)" = 0 ] || ok=1
is_idle || ok=1
report TC-TIMER-003 $ok "앱 진동 $(echo "$vibrations" | grep -c '^app TOUCH'), 완료 알림 $(count_completions), 실시간 업데이트 알림 $(count_notifications live-activity)"

since=$(now_stamp)
tap controls-play
start=$(now_epoch)
go_home
wait_until_epoch $((start + FOCUS_DONE))
vibrations=$(vibrations_since "$since")
ok=0
[ "$(count_notifications vibration)" = 1 ] || ok=1
echo "$vibrations" | grep -q '^notification NOTIFICATION' || ok=1
[ "$(count_notifications live-activity)" = 1 ] || ok=1
report TC-TIMER-004 $ok "vibration 채널 알림 $(count_notifications vibration), 알림 진동 $(echo "$vibrations" | grep -c '^notification'), 실시간 업데이트 알림 $(count_notifications live-activity)"

since=$(now_stamp)
wait_until_epoch $((start + REST_DONE))
vibrations=$(vibrations_since "$since")
ok=0
[ "$(count_notifications vibration)" = 2 ] || ok=1
echo "$vibrations" | grep -q '^notification NOTIFICATION' || ok=1
[ "$(count_notifications live-activity)" = 0 ] || ok=1
report TC-TIMER-005 $ok "vibration 채널 알림 $(count_notifications vibration), 알림 진동 $(echo "$vibrations" | grep -c '^notification'), 실시간 업데이트 알림 $(count_notifications live-activity)"

completions_before=$(count_completions)
launch
ok=0
is_idle || ok=1
report TC-TIMER-006 $ok "다시 진입 후 정지 버튼 $(is_idle && echo 비활성 || echo 활성)"

tap controls-play
sleep 3
ok=0
[ "$completions_before" = 2 ] || ok=1
[ "$(count_completions)" = 0 ] || ok=1
report TC-NOTIFICATION-001 $ok "시작 전 완료 알림 $completions_before, 다음 집중 타이머 시작 후 $(count_completions)"
tap controls-stop
