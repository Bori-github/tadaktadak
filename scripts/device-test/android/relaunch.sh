#!/bin/sh
# Test Cases: TC-TIMER-010, TC-TIMER-011, TC-TIMER-012, TC-TIMER-013, TC-TIMER-014, TC-TIMER-015
# 소요 시간: 7분
. "$(dirname "$0")/lib.sh"

set_ringer 2
start_idle

tap controls-play
sleep 3
icon_before=$(live_icon)
tap controls-play
sleep 1
close_app
launch
ok=0
is_idle && ok=1
[ "$(count_notifications live-activity)" = 0 ] || ok=1
evidence="일시정지 상태에서 앱 종료 후 다시 진입 시 정지 버튼 $(is_idle && echo 비활성 || echo 활성), 실시간 업데이트 알림 $(count_notifications live-activity)"
# 모드는 일시정지 상태에서 화면 밖이라 재개 후 알림 아이콘으로 확인
tap controls-play
sleep 2
[ "$(live_icon)" = "$icon_before" ] || ok=1
report TC-TIMER-010 $ok "$evidence, 재개 후 알림 아이콘 $(live_icon)(종료 전 $icon_before)"
tap controls-stop

tap controls-play
sleep 3
ends_before=$(live_ends_at)
sleep 7
close_app
closed=$(now_epoch)
sleep 5
launch
reopened=$(($(now_epoch) - closed))
ok=0
is_idle && ok=1
[ "$(count_notifications live-activity)" = 1 ] || ok=1
keep_screen_on || ok=1
# 남은 시간 = 끝날 시각 − 지금 시각이면 끝날 시각이 그대로 유지됨
[ "$(live_ends_at)" = "$ends_before" ] || ok=1
report TC-TIMER-011 $ok "진행 상태에서 앱 종료, ${reopened}초 뒤 다시 진입 시 실시간 업데이트 알림 $(count_notifications live-activity), 화면 꺼짐 방지 $(keep_screen_on && echo 켜짐 || echo 꺼짐), 끝날 시각 $(live_ends_at)(종료 전 $ends_before)"
tap controls-stop

tap controls-play
start=$(now_epoch)
sleep 3
close_app
wait_until_epoch $((start + 65))
launch
# 완료 연출 3.5초 뒤 휴식 타이머 진행
sleep 5
ok=0
is_idle && ok=1
[ "$(count_notifications live-activity)" = 1 ] || ok=1
report TC-TIMER-012 $ok "집중 타이머 끝날 시각 뒤 다시 진입, 5초 뒤 정지 버튼 $(is_idle && echo 비활성 || echo 활성), 실시간 업데이트 알림 $(count_notifications live-activity)"
tap controls-stop

tap controls-play
start=$(now_epoch)
wait_until_epoch $((start + 65))
close_app
wait_until_epoch $((start + 130))
launch
ok=0
is_idle || ok=1
[ "$(count_notifications live-activity)" = 0 ] || ok=1
report TC-TIMER-013 $ok "휴식 타이머 끝날 시각 뒤 다시 진입 시 정지 버튼 $(is_idle && echo 비활성 || echo 활성), 실시간 업데이트 알림 $(count_notifications live-activity)"

tap controls-play
start=$(now_epoch)
# 완료 연출 3.5초 안에 앱 종료. 화면 덤프 없이 앞서 찾은 카드 좌표로 바로 드래그
wait_until_epoch $((start + 60))
device shell input keyevent KEYCODE_APP_SWITCH
sleep 1
closed=$(($(now_epoch) - start - 60))
swipe_card
launch
sleep 5
ok=0
[ "$closed" -le 3 ] || ok=1
is_idle && ok=1
[ "$(count_notifications live-activity)" = 1 ] || ok=1
report TC-TIMER-014 $ok "완료 ${closed}초 뒤 앱 종료 후 다시 진입, 5초 뒤 실시간 업데이트 알림 $(count_notifications live-activity), 정지 버튼 $(is_idle && echo 비활성 || echo 활성)"
tap controls-stop

close_app
launch
ok=0
is_idle || ok=1
evidence="대기 상태에서 앱 종료 후 다시 진입 시 정지 버튼 $(is_idle && echo 비활성 || echo 활성)"
# 타이머 시간(분)은 Skia로 그려 화면에서 읽지 못해 실시간 업데이트 알림 제목으로 확인
tap controls-play
sleep 2
title=$(notification_extra live-activity android.title)
echo "$title" | grep -Eq '^1( |분)' || ok=1
report TC-TIMER-015 $ok "$evidence, 시작 후 알림 제목 $title"
tap controls-stop
