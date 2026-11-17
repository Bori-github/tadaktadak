#!/bin/sh
# Test Cases: TC-TIMER-021, TC-TIMER-022, TC-TIMER-023, TC-TIMER-024, TC-TIMER-025, TC-TIMER-026, TC-TIMER-027, TC-TIMER-028, TC-TIMER-029, TC-TIMER-030
# 주의사항:
# - TC-TIMER-021 영어 문구는 런처가 앱별 언어가 아닌 시스템 언어를 따라 기기 언어를 직접 변경
# - TC-TIMER-028은 휴식 타이머를 0분으로 설정하고 끝나거나 중단되면 1분으로 복원
# - TC-TIMER-030은 알림 권한을 거부로 설정하고 끝나면 허용으로 복원
# - TC-TIMER-024는 앱 데이터를 삭제해 새로 설치한 상태로 초기화하고 끝나면 타이머 시간(분)을 1분으로 복원
. "$(dirname "$0")/lib.sh"

grant() {
  device shell pm grant "$PACKAGE" android.permission.POST_NOTIFICATIONS
}
restore_rest() {
  start_idle && tap readout-rest && drag_minutes 0 1 && tap readout-focus
}
trap '(grant); [ -z "${changed_rest:-}" ] || (restore_rest); restore' EXIT

set_ringer 2
start_idle

close_app
open_shortcut_menu 타닥타닥
ko_label=$(shortcut_label)
tap_shortcut
wait_for controls-play
wait_until_gone splash
sleep 2
ok=0
is_idle && ok=1
[ "$(live_minutes)" = 1 ] || ok=1
[ "$(count_alarms)" -gt 0 ] || ok=1
report TC-TIMER-022 $ok "앱 종료 상태에서 실행 후 정지 버튼 $(is_idle && echo 비활성 || echo 활성), 실시간 업데이트 알림 $(live_minutes)분, 예약 알람 $(count_alarms)"
tap controls-stop

run_shortcut
sleep 2
ok=0
is_idle && ok=1
[ "$(live_minutes)" = 1 ] || ok=1
report TC-TIMER-023 $ok "백그라운드에서 실행 후 정지 버튼 $(is_idle && echo 비활성 || echo 활성), 실시간 업데이트 알림 $(live_minutes)분"

ends_before=$(live_ends_at)
open_shortcut_menu 타닥타닥
tap_shortcut
shown=$(toast_shown && echo 표시 || echo 없음)
sleep 4
dump_ui
after=$(visible start-rejected-toast)
ok=0
[ "$shown" = 표시 ] || ok=1
[ "$after" = 없음 ] || ok=1
is_idle && ok=1
[ "$(live_ends_at)" = "$ends_before" ] || ok=1
report TC-TIMER-025 $ok "집중 타이머 진행 중 실행 후 토스트 $shown, 4초 뒤 $after, 끝날 시각 $(live_ends_at)(실행 전 $ends_before)"

open_shortcut_menu 타닥타닥
tap_shortcut
shown=$(toast_shown && echo 표시 || echo 없음)
# 토스트가 사라지기 전에 터치하도록 `tap`의 화면 덤프 없이 마지막 덤프 좌표 사용
# shellcheck disable=SC2046
device shell input tap $(center controls-stop)
sleep 1
dump_ui
after=$(visible start-rejected-toast)
ok=0
[ "$shown" = 표시 ] || ok=1
[ "$after" = 없음 ] || ok=1
is_idle && ok=1
[ "$(count_notifications live-activity)" = 1 ] || ok=1
report TC-TIMER-029 $ok "토스트 $shown 상태에서 정지 버튼 터치 후 토스트 $after, 정지 버튼 $(is_idle && echo 비활성 || echo 활성), 실시간 업데이트 알림 $(count_notifications live-activity)"
is_idle || { tap controls-stop; sleep 1; }

tap controls-play
sleep 2
tap controls-play
sleep 1
open_shortcut_menu 타닥타닥
tap_shortcut
shown=$(toast_shown && echo 표시 || echo 없음)
sleep 4
ok=0
[ "$shown" = 표시 ] || ok=1
is_idle && ok=1
[ "$(count_notifications live-activity)" = 0 ] || ok=1
report TC-TIMER-026 $ok "일시정지 중 실행 후 토스트 $shown, 정지 버튼 $(is_idle && echo 비활성 || echo 활성), 실시간 업데이트 알림 $(count_notifications live-activity)"
tap controls-stop

tap controls-play
start=$(now_epoch)
wait_until_epoch $((start + FOCUS_DONE))
ends_before=$(live_ends_at)
icon_before=$(live_icon)
open_shortcut_menu 타닥타닥
tap_shortcut
shown=$(toast_shown && echo 표시 || echo 없음)
sleep 4
ok=0
[ "$shown" = 표시 ] || ok=1
[ "$(live_ends_at)" = "$ends_before" ] || ok=1
[ "$(live_icon)" = "$icon_before" ] || ok=1
report TC-TIMER-027 $ok "휴식 타이머 진행 중 실행 후 토스트 $shown, 끝날 시각 $(live_ends_at)(실행 전 $ends_before), 알림 아이콘 $(live_icon)(실행 전 $icon_before)"
tap controls-stop

tap readout-rest
drag_minutes 1 0
changed_rest=1
tap readout-focus
tap controls-play
start=$(now_epoch)
go_home
# 완료 연출 3.5초 안에 실행하도록 앱 아이콘 메뉴를 미리 표시
wait_until_epoch $((start + 55))
open_shortcut_menu 타닥타닥
wait_until_epoch $((start + 61))
tap_shortcut
shown=$(toast_shown && echo 표시 || echo 없음)
sleep 2
ok=0
[ "$shown" = 없음 ] || ok=1
is_idle && ok=1
[ "$(live_minutes)" = 1 ] || ok=1
report TC-TIMER-028 $ok "휴식 타이머 0분, 집중 타이머 완료 1초 뒤 실행 후 토스트 $shown, 정지 버튼 $(is_idle && echo 비활성 || echo 활성), 실시간 업데이트 알림 $(live_minutes)분"
restore_rest
changed_rest=

device shell pm revoke "$PACKAGE" android.permission.POST_NOTIFICATIONS
run_shortcut
start=$(now_epoch)
sleep 2
state=$(is_idle && echo 대기 || echo 진행)
go_home
wait_until_epoch $((start + FOCUS_DONE))
ok=0
[ "$state" = 진행 ] || ok=1
[ "$(count_completions)" = 0 ] || ok=1
report TC-TIMER-030 $ok "알림 권한 거부 상태에서 실행 후 $state, 완료 알림 $(count_completions)"
grant
start_idle

clear_app
run_shortcut
sleep 2
minutes=$(live_minutes)
ok=0
[ "$minutes" = 25 ] || ok=1
report TC-TIMER-024 $ok "앱 데이터 삭제 후 실행, 실시간 업데이트 알림 ${minutes}분"
close_tooltip
tap controls-stop

prompt "TC-TIMER-021: 기기 언어를 English로 변경"
open_shortcut_menu "Tadak Tadak"
en_label=$(shortcut_label)
go_home
prompt "TC-TIMER-021: 기기 언어를 한국어로 복원"
ok=0
[ "$ko_label" = "타닥타닥 시작" ] || ok=1
[ "$en_label" = "Start Tadak Tadak" ] || ok=1
report TC-TIMER-021 $ok "앱 아이콘 메뉴 문구 한국어 $ko_label, 영어 $en_label"
