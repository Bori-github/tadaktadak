#!/bin/sh
# Test Cases: TC-TIMER-007, TC-TIMER-008, TC-TIMER-009, TC-TIMER-017, TC-LOCK-SCREEN-001
# 소요 시간: 1분
. "$(dirname "$0")/lib.sh"

state() {
  echo "예약 알람 $(count_alarms), 실시간 업데이트 알림 $(count_notifications live-activity), 화면 꺼짐 방지 $(keep_screen_on && echo 켜짐 || echo 꺼짐)"
}

set_ringer 2
start_idle

tap controls-play
sleep 3
running=$(state)
ok=0
keep_screen_on || ok=1
report TC-TIMER-017 $ok "진행 상태 $running"

ends_before=$(live_ends_at)
paused_at=$(now_epoch)
tap controls-play
sleep 2
ok=0
[ "$(count_alarms)" = 0 ] || ok=1
[ "$(count_notifications live-activity)" = 0 ] || ok=1
keep_screen_on && ok=1
is_idle && ok=1
paused=$(state)
sleep 5

resumed_at=$(now_epoch)
tap controls-play
sleep 2
# 일시정지 동안 남은 시간이 고정이면 끝날 시각이 일시정지한 시간만큼 늦춰짐. adb 지연으로 ±2초 허용
shift=$((($(live_ends_at) - ends_before) / 1000))
paused_for=$((resumed_at - paused_at))
fixed=$([ $((shift - paused_for)) -ge -2 ] && [ $((shift - paused_for)) -le 2 ] && echo 1 || echo 0)
[ "$fixed" = 1 ] || ok=1
report TC-TIMER-007 $ok "일시정지 후 $paused, 일시정지 ${paused_for}초 동안 끝날 시각 ${shift}초 늦춰짐"

ok=0
[ "$fixed" = 1 ] || ok=1
[ "$(count_alarms)" -gt 0 ] || ok=1
[ "$(count_notifications live-activity)" = 1 ] || ok=1
keep_screen_on || ok=1
report TC-TIMER-008 $ok "재개 후 $(state), 끝날 시각 ${shift}초 늦춰짐(일시정지 ${paused_for}초)"

tap controls-stop
sleep 2
ok=0
[ "$(count_alarms)" = 0 ] || ok=1
[ "$(count_notifications live-activity)" = 0 ] || ok=1
keep_screen_on && ok=1
is_idle || ok=1
report TC-TIMER-009 $ok "정지 후 $(state)"

tap controls-play
sleep 2
go_home
ends_at=$(live_ends_at)
# 정지 버튼이 앱 Activity를 여는 PendingIntent인지 `dumpsys`로 확인. 앱이 열리는지는 이 확인으로 대신함
dump=$(notification_dump)
opens_app=$(printf '%s\n' "$dump" 2> /dev/null | grep -m1 '\[0\] ".*PendingIntentRecord{.* '"$PACKAGE"' startActivity' > /dev/null && echo 1 || echo 0)
# 알림창은 진행 상태의 남은 시간이 계속 바뀌어 `uiautomator dump`가 실패해 버튼 좌표를 얻을 수 없음. 그래서 버튼의 PendingIntent와 같은 Intent를 `am start`로 직접 전송
device shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n "$PACKAGE/.MainActivity" --el expo.modules.liveactivity.STOPPED_ENDS_AT "$ends_at" > /dev/null
sleep 3
ok=0
[ "$opens_app" = 1 ] || ok=1
[ "$(count_alarms)" = 0 ] || ok=1
[ "$(count_notifications live-activity)" = 0 ] || ok=1
is_idle || ok=1
report TC-LOCK-SCREEN-001 $ok "정지 버튼 PendingIntent 앱 Activity 실행 $opens_app, 정지 Intent 전송 후 $(state)"
