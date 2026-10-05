#!/bin/sh
# 완료 알림 채널/진동/소리를 벨소리 모드 × 진동 토글 × 앱 상태 12가지 조합으로 확인
# Test Cases: TC-TIMER-002, TC-TIMER-004, TC-NOTIFICATION-004, TC-NOTIFICATION-005, TC-NOTIFICATION-006, TC-NOTIFICATION-007, TC-SETTINGS-001, TC-SETTINGS-002. 각 TC의 완료 알림 채널/진동/소리만 확인
# 소요 시간: 17분
# 주의사항:
# - 출력 첫 칸은 TC ID가 아니라 조합
. "$(dirname "$0")/lib.sh"

mode_name() {
  case $1 in 0) echo 무음 ;; 1) echo 진동 ;; 2) echo 소리 ;; esac
}

# $1 벨소리 모드, $2 진동 토글, $3 앱 상태. 출력은 완료 알림 채널, 앱 진동 여부, 알림 진동 여부
expected() {
  if [ "$2" = 0 ]; then
    echo "banner 0 0"
  elif [ "$3" = 포그라운드 ]; then
    echo "- 1 0"
  # 무음 모드는 시스템이 알림 진동을 막아 진동 없음
  elif [ "$1" = 0 ]; then
    echo "vibration 0 0"
  else
    echo "vibration 0 1"
  fi
}

run_case() {
  set_ringer "$1"
  start_idle
  since=$(now_stamp)
  tap controls-play
  start=$(now_epoch)
  [ "$3" = 백그라운드 ] && go_home
  wait_until_epoch $((start + FOCUS_DONE))
  vibrations=$(vibrations_since "$since")
  channel=$(notifications | grep -m1 -xE 'vibration|banner' || true)
  app=$(echo "$vibrations" | grep -q '^app MEDIA' && echo 1 || echo 0)
  system=$(echo "$vibrations" | grep -q '^notification' && echo 1 || echo 0)
  actual="${channel:--} $app $system"
  sounds=$(sounds_since "$since")
  ok=0
  [ "$actual" = "$(expected "$@")" ] || ok=1
  [ "$sounds" = 0 ] || ok=1
  toggle=$([ "$2" = 1 ] && echo 켜짐 || echo 꺼짐)
  report "$(mode_name "$1") 모드/진동 토글 $toggle/$3" $ok "채널, 앱 진동, 알림 진동 $actual(기대 $(expected "$@")), 소리 $sounds"
  launch
  tap controls-stop
}

for vibration in 1 0; do
  start_idle
  set_vibration "$vibration"
  for mode in 2 1 0; do
    for state in 포그라운드 백그라운드; do
      run_case "$mode" "$vibration" "$state"
    done
  done
done

start_idle
set_vibration 1
