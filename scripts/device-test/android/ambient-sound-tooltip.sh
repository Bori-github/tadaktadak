#!/bin/sh
# Test Cases: TC-AMBIENT-SOUND-012, TC-AMBIENT-SOUND-017, TC-AMBIENT-SOUND-013, TC-AMBIENT-SOUND-016, TC-AMBIENT-SOUND-014, TC-AMBIENT-SOUND-015
# 소요 시간: 2분
# 주의사항:
# - 앱 데이터를 삭제하고 끝나거나 중단되면 집중/휴식 타이머를 1분으로 복원
# - 다른 스크립트보다 먼저 실행. 배경음 툴팁 표시 중에는 첫 터치가 툴팁만 닫아 다른 스크립트의 조작이 실패함
. "$(dirname "$0")/lib.sh"

TOOLTIP_TEXT='타닥타닥, 장작 타는 소리와 함께해 보세요.'

shown() {
  tooltip_shown && echo 표시 || echo 없음
}

clear_app
launch
ok=0
first=$(shown)
text=$(grep -q "text=\"$TOOLTIP_TEXT\"" "$OUT/ui.xml" && echo 일치 || echo 다름)
sleep 10
later=$(shown)
{ [ "$first" = 표시 ] && [ "$text" = 일치 ] && [ "$later" = 표시 ]; } || ok=1
report TC-AMBIENT-SOUND-012 $ok "앱 데이터 삭제 후 실행 시 툴팁 $first, 문구 $text, 10초 뒤 툴팁 $later"

close_app
launch
ok=0
reopened=$(shown)
[ "$reopened" = 표시 ] || ok=1
report TC-AMBIENT-SOUND-017 $ok "툴팁을 닫지 않고 앱 종료 후 다시 진입 시 툴팁 $reopened"

ok=0
tooltip_shown || ok=1
# 배경음 버튼과 설정 버튼 사이의 빈 곳
# shellcheck disable=SC2046
device shell input tap $(center readout-focus | cut -d' ' -f1) $(center settings | cut -d' ' -f2)
sleep 1
closed=$(shown)
[ "$closed" = 없음 ] || ok=1
report TC-AMBIENT-SOUND-013 $ok "빈 곳 터치 후 툴팁 $closed"

close_app
launch
ok=0
reopened=$(shown)
[ "$reopened" = 없음 ] || ok=1
report TC-AMBIENT-SOUND-016 $ok "툴팁을 닫은 뒤 앱 종료 후 다시 진입 시 툴팁 $reopened"

clear_app
launch
ok=0
tooltip_shown || ok=1
tap ambient-sound
closed=$(shown)
playing=$(wait_ambient 1 && echo 재생 || echo 정지)
{ [ "$closed" = 없음 ] && [ "$playing" = 정지 ]; } || ok=1
report TC-AMBIENT-SOUND-014 $ok "배경음 버튼 터치 후 툴팁 $closed, 10초 동안 배경음 $playing"

clear_app
launch
ok=0
tooltip_shown || ok=1
device shell input keyevent KEYCODE_BACK
sleep 1
closed=$(shown)
screen=$([ -n "$(center controls-play)" ] && echo 유지 || echo 이탈)
{ [ "$closed" = 없음 ] && [ "$screen" = 유지 ]; } || ok=1
report TC-AMBIENT-SOUND-015 $ok "Android 뒤로 버튼 후 툴팁 $closed, 타이머 화면 $screen"
