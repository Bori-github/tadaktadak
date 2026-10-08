#!/bin/sh
# Test Cases: TC-NOTIFICATION-002, TC-NOTIFICATION-003, TC-AMBIENT-SOUND-009
# 소요 시간: 3분
# 주의사항:
# - 알림 권한을 거부로 설정하고 끝나면 허용으로 복원
. "$(dirname "$0")/lib.sh"

grant() {
  device shell pm grant "$PACKAGE" android.permission.POST_NOTIFICATIONS
}
trap '(grant); restore' EXIT

set_ringer 2
device shell pm revoke "$PACKAGE" android.permission.POST_NOTIFICATIONS
start_idle

wait_for notification-settings
# shellcheck disable=SC2046
set -- $(center notification-settings) $(center ambient-sound)
ok=0
{ [ "$1" -lt "$3" ] && [ "$2" = "$4" ]; } || ok=1
report TC-AMBIENT-SOUND-009 $ok "알림 설정 버튼 중심 ($1, $2), 배경음 버튼 중심 ($3, $4)"

since=$(now_stamp)
tap controls-play
start=$(now_epoch)
wait_until_epoch $((start + FOCUS_DONE))
vibrations=$(vibrations_since "$since")
tap controls-stop
tap notification-settings
sleep 2
settings_opened=$(resumed_activity | grep -q InstalledAppDetails && echo 열림 || echo 열리지 않음)
ok=0
echo "$vibrations" | grep -q '^app MEDIA' || ok=1
[ "$settings_opened" = 열림 ] || ok=1
report TC-NOTIFICATION-002 $ok "앱 진동 $(echo "$vibrations" | grep -c '^app MEDIA'), 알림 설정 버튼으로 앱 정보 화면 $settings_opened"

launch
since=$(now_stamp)
tap controls-play
start=$(now_epoch)
go_home
wait_until_epoch $((start + FOCUS_DONE))
vibrations=$(vibrations_since "$since")
completions=$(count_completions)
launch
# 알림이 없어 완료 여부를 알림으로 확인하지 못해 휴식 타이머 진행으로 집중 타이머 완료 확인
ok=0
is_idle && ok=1
[ "$completions" = 0 ] || ok=1
echo "$vibrations" | grep -q '^notification' && ok=1
report TC-NOTIFICATION-003 $ok "완료 알림 $completions, 알림 진동 $(echo "$vibrations" | grep -c '^notification'), 다시 진입 시 정지 버튼 $(is_idle && echo 비활성 || echo 활성)"
tap controls-stop
