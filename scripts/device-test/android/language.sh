#!/bin/sh
# Test Cases: TC-SETTINGS-005, TC-TIMER-016
# 소요 시간: 3분
# 주의사항:
# - 앱 언어를 English로 설정하고 끝나거나 중단되면 시스템(기본)으로 복원
. "$(dirname "$0")/lib.sh"

set_ringer 2
start_idle
select_language en-US
close_app
launch
# 번역 문구 중 화면에 나오는 것은 설정 화면의 `Text`라 화면 덤프로 확인
screen_texts=0
tap settings
wait_for settings-language
for text in English; do grep -q "text=\"$text\"" "$OUT/ui.xml" || screen_texts=1; done
tap settings-language
wait_for language-system
for text in "System (default)" "If unsupported, English will be used"; do grep -q "text=\"$text\"" "$OUT/ui.xml" || screen_texts=1; done
tap modal-back
tap settings-more
wait_for more-privacy-policy
for text in Version "Privacy Policy"; do grep -q "text=\"$text\"" "$OUT/ui.xml" || screen_texts=1; done
tap modal-close

tap controls-play
start=$(now_epoch)
sleep 3
title=$(notification_extra live-activity android.title)
action=$(live_action)
go_home
wait_until_epoch $((start + FOCUS_DONE))
completion_title=$(notification_extra vibration android.title)
completion_text=$(notification_extra vibration android.text)
channels="$(channel_name vibration)/$(channel_name banner)/$(channel_name live-activity)"
wait_until_epoch $((start + REST_DONE))
dump=$(notification_dump)
rest_text=$(printf '%s\n' "$dump" | grep -c "android.text=String (Break’s over!)" || true)
ok=$screen_texts
[ "$title" = "1 min" ] || ok=1
[ "$action" = Stop ] || ok=1
[ "$completion_title" = "Tadak Tadak" ] || ok=1
[ "$completion_text" = "Boom, done!" ] || ok=1
[ "$rest_text" -ge 1 ] || ok=1
[ "$channels" = "Vibration alerts/Banner alerts/Live update alerts" ] || ok=1
report TC-SETTINGS-005 $ok "설정 화면 문구 $([ "$screen_texts" = 0 ] && echo 일치 || echo 불일치), 실시간 업데이트 알림 $title/$action, 완료 알림 $completion_title/$completion_text, 휴식 완료 알림 Break’s over! $rest_text, 채널 $channels"
launch
tap controls-stop
select_language system

drag_minutes 1 5
close_app
launch
minutes=$(focus_minutes)
ok=0
[ "$minutes" = 5 ] || ok=1
report TC-TIMER-016 $ok "5분으로 설정 후 앱 종료, 다시 진입 시 타이머 시간 ${minutes}분"
drag_minutes 5 1
