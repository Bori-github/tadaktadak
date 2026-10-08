#!/bin/sh
# Test Cases: TC-AMBIENT-SOUND-001, TC-AMBIENT-SOUND-002, TC-AMBIENT-SOUND-003, TC-AMBIENT-SOUND-004, TC-AMBIENT-SOUND-005, TC-AMBIENT-SOUND-006, TC-AMBIENT-SOUND-007
# 소요 시간: 5분
# 주의사항:
# - `scrcpy`(2.0 이상, 기기 오디오 녹음)와 `ffmpeg` 필요
# - 벨소리 모드를 무음/진동으로 설정하고 끝나면 원래 모드로 복원
. "$(dirname "$0")/lib.sh"

piid() {
  ambient_state | cut -d' ' -f1
}

# $1 `testID` 요소 영역의 화면 픽셀 체크섬
element_pixels() {
  dump_ui
  # shellcheck disable=SC2046
  set -- $(grep -o "resource-id=\"$1\"[^>]*bounds=\"[^\"]*\"" "$OUT/ui.xml" | head -1 | sed -E 's/.*\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"$/\1 \2 \3 \4/')
  device exec-out screencap -p | ffmpeg -v error -i - -vf "crop=$(($3 - $1)):$(($4 - $2)):$1:$2" -f rawvideo - | cksum
}

# $1 녹음 파일. 소리 시작 기준 0.5초/1.5초 구간 RMS와 2~4초 구간 평균의 차(dB) 출력
fade_in() {
  ffmpeg -v error -i "$1" -af "asetnsamples=n=12000,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" -f null - | awk -F'pts_time:|=' '
    /pts_time/ { t = $2 }
    /RMS_level/ {
      if (start == "" && $2 != "-inf") start = t
      if (start != "") level[int((t - start) / 0.25 + 0.5)] = $2
    }
    END {
      for (i = 8; i < 16; i++) sum += level[i]
      early = level[2] - sum / 8; late = level[6] - sum / 8
      printf "0.5초 %.1fdB, 1.5초 %.1fdB\n", early, late
      # 음량을 2초 동안 선형으로 올리면 이론값 -12dB/-2.5dB라 -6dB 기준으로 판정
      exit !(early <= -6 && late > -6)
    }'
}

# $1 벨소리 모드, $2 TC ID, $3 모드 이름
ringer_mode() {
  set_ringer "$1"
  ok=0
  tap ambient-sound
  wait_ambient 1 || ok=1
  # `ambient_state`가 `USAGE_MEDIA` 플레이어만 읽어 재생 중이면 미디어 스트림으로 출력
  muted=$(dumpsys_checked "Ringer mode" audio | awk '/^- STREAM_MUSIC:/ { found = 1 } found && $1 == "Muted:" && muted == "" { muted = $2 } END { print muted }')
  volume=$(device shell cmd media_session volume --stream 3 --get | sed -n 's/.*volume is \([0-9]*\).*/\1/p')
  { [ "$muted" = false ] && [ "${volume:-0}" -gt 0 ]; } || ok=1
  report "$2" $ok "$3 모드(벨소리 모드 $(ringer))에서 켜기 후 플레이어 $(ambient_state), 미디어 스트림 음소거 ${muted:-없음}, 미디어 볼륨 ${volume:-없음}"
  tap ambient-sound
  wait_ambient 0
}

set_ringer 2
start_idle
set_ambient 0
changed_ambient=1

ok=0
off_icon=$(element_pixels ambient-sound)
tap ambient-sound
wait_ambient 1 || ok=1
on_icon=$(element_pixels ambient-sound)
first=$(piid)
on_at=$(now_epoch)
# 음원 길이보다 5초 더 재생해 반복 재생 확인
duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$(dirname "$0")/../../../assets/sounds/fire-loop.m4a" | cut -d. -f1)
wait_until_epoch $((on_at + duration + 5))
wait_ambient 1 || ok=1
[ "$(piid)" = "$first" ] || ok=1
tap ambient-sound
wait_ambient 0 || ok=1
off_again_icon=$(element_pixels ambient-sound)
{ [ "$on_icon" != "$off_icon" ] && [ "$off_again_icon" = "$off_icon" ]; } || ok=1
# 녹음 중 출력 장치가 바뀐 플레이어는 반복 지점에서 다시 생성돼 반복 재생 확인 뒤 따로 녹음
# 중단돼도 녹음이 남지 않도록 `--time-limit`으로 종료
scrcpy -s "$SERIAL" --no-video --no-playback --no-window --audio-codec=raw --time-limit=14 --record="$OUT/ambient.wav" > "$OUT/scrcpy.log" 2>&1 &
recorder=$!
sleep 3
tap ambient-sound
wait "$recorder"
fade=$(fade_in "$OUT/ambient.wav") || ok=1
tap ambient-sound
wait_ambient 0 || ok=1
report TC-AMBIENT-SOUND-001 $ok "$((duration + 5))초 동안 플레이어 $first 재생 유지, 아이콘 켜짐 $([ "$on_icon" != "$off_icon" ] && echo 전환 || echo 그대로)/꺼짐 $([ "$off_again_icon" = "$off_icon" ] && echo 복귀 || echo 다름), 페이드인 $fade, 끄기 후 $(ambient_state)"

set_ambient 1
close_app
open_app
ok=0
# 화면 덤프 1회에 2.5~3초가 걸려 `splash`가 보인 마지막 덤프의 시작 시각과 재생 시작 시각을 비교
splash_seen=
for _ in 1 2 3 4 5 6 7 8 9 10; do
  # 같은 날의 HHMMSSmmm
  checked_at=$(device shell date +%H%M%S%3N | tr -d '\r')
  dump_ui
  if grep -q 'resource-id="splash"' "$OUT/ui.xml"; then
    splash_seen=$checked_at
  elif [ -n "$splash_seen" ]; then
    break
  fi
done
wait_ambient 1 || ok=1
player=$(piid)
started_at=$(dumpsys_checked "Ringer mode" audio | awk -v event="player piid:$player state:started" 'index($0, event) && !time { time = $2 } END { gsub(":", "", time); print time }')
{ [ -n "$splash_seen" ] && [ -n "$started_at" ] && [ "$started_at" -gt "$splash_seen" ]; } || ok=1
icon=$([ "$(element_pixels ambient-sound)" = "$on_icon" ] && echo 켜짐 || echo 다름)
[ "$icon" = 켜짐 ] || ok=1
report TC-AMBIENT-SOUND-002 $ok "앱 종료 후 다시 진입, 스플래시 마지막 확인 ${splash_seen:-없음}, 재생 시작 ${started_at:-없음}, 플레이어 $(ambient_state), 아이콘 $icon"

before=$(piid)
go_home
ok=0
wait_ambient 0 || ok=1
paused=$(ambient_state)
launch
wait_ambient 1 || ok=1
after=$(piid)
[ "$after" -gt "$before" ] || ok=1
report TC-AMBIENT-SOUND-003 $ok "홈 화면 이동 후 $paused, 복귀 후 새 플레이어 $after 재생"

start=$(piid)
ok=0
tap controls-play
begin=$(now_epoch)
sleep 5
wait_ambient 1 || ok=1
tap controls-play
sleep 5
wait_ambient 1 || ok=1
tap controls-play
# 일시정지 5초만큼 완료가 늦어짐
wait_until_epoch $((begin + FOCUS_DONE + 5))
wait_ambient 1 || ok=1
[ "$(piid)" = "$start" ] || ok=1
report TC-AMBIENT-SOUND-004 $ok "진행/일시정지/재개/완료 후 플레이어 $start 유지, 현재 $(ambient_state)"
tap controls-stop
sleep 1

start=$(piid)
ok=0
tap settings
sleep 10
wait_ambient 1 || ok=1
tap modal-close
sleep 2
wait_ambient 1 || ok=1
[ "$(piid)" = "$start" ] || ok=1
report TC-AMBIENT-SOUND-005 $ok "설정 화면 진입 10초 후 닫기, 플레이어 $start 유지, 현재 $(ambient_state)"

set_ambient 0
ringer_mode 0 TC-AMBIENT-SOUND-006 무음
ringer_mode 1 TC-AMBIENT-SOUND-007 진동
