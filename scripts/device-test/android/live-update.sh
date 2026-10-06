#!/bin/sh
# Test Cases: TC-LOCK-SCREEN-003, TC-LOCK-SCREEN-004, TC-LOCK-SCREEN-006
# 소요 시간: 2분
. "$(dirname "$0")/lib.sh"

# $1 관찰 초. 진행 막대 값이 바뀐 시각 사이의 간격(초)을 공백으로 구분해 출력
progress_intervals() {
  last= last_at= intervals=
  end=$(($(now_epoch) + $1))
  while [ "$(now_epoch)" -lt "$end" ]; do
    value=$(notification_extra live-activity android.progress)
    at=$(now_epoch)
    # 첫 값은 갱신 도중에 읽은 값이라 간격 계산에서 제외하고 첫 변경 시각부터 측정
    if [ -z "$last" ]; then
      last=$value
    elif [ "$value" != "$last" ]; then
      [ -n "$last_at" ] && intervals="$intervals $((at - last_at))"
      last=$value last_at=$at
    fi
  done
  echo "$intervals" | sed 's/^ //'
}

# $1 TC ID, $2 관찰 초, $3/$4 허용 간격 최소/최대(초)
check_interval() {
  start_idle
  tap controls-play
  sleep 2
  intervals=$(progress_intervals "$2")
  ok=0
  [ -n "$intervals" ] || ok=1
  for i in $intervals; do
    [ "$i" -ge "$3" ] && [ "$i" -le "$4" ] || ok=1
  done
  report "$1" $ok "진행 막대 갱신 간격(초) $intervals"
  tap controls-stop
}

set_ringer 2
# 1분의 1%는 0.6초라 최소값 1초. 값 조회 지연으로 2초까지 허용
check_interval TC-LOCK-SCREEN-003 15 1 2

start_idle
tap controls-play
sleep 2
device shell input keyevent KEYCODE_SLEEP
sleep 10
device shell input keyevent KEYCODE_WAKEUP
sleep 1
progress=$(notification_extra live-activity android.progress)
ok=0
[ "${progress:-0}" -ge 10 ] || ok=1
report TC-LOCK-SCREEN-004 $ok "화면 꺼짐 10초 뒤 화면 켜짐 직후 진행 막대 $progress"
launch
tap controls-stop

start_idle
drag_minutes 1 10
# 10분의 1%는 6초. 값 조회 지연으로 ±1초 허용
check_interval TC-LOCK-SCREEN-006 40 5 7
drag_minutes 10 1
