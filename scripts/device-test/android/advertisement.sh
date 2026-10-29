#!/bin/sh
# Test Cases: TC-ADVERTISEMENT-001, TC-ADVERTISEMENT-003, TC-ADVERTISEMENT-006, TC-ADVERTISEMENT-004, TC-ADVERTISEMENT-005
# 소요 시간: 2분
# 주의사항:
# - 비행기 모드를 켜고 끝나거나 중단되면 끔
# - 앱 데이터를 삭제하고 끝나거나 중단되면 집중/휴식 타이머를 1분으로 복원
. "$(dirname "$0")/lib.sh"

footer() {
  [ -n "$(center advertisement-footer)" ] && echo 표시 || echo 없음
}

start_idle
tap settings
ok=0
skeleton=없음
banner=없음
# 화면 덤프 1회에 2.5~3초가 걸려 스켈레톤을 놓칠 수 있어 근거에만 기록
for _ in 1 2 3 4 5; do
  dump_ui
  [ -n "$(center advertisement-skeleton)" ] && skeleton=표시
  if grep -q 'class="android.webkit.WebView"' "$OUT/ui.xml"; then
    banner=표시
    break
  fi
  sleep 1
done
[ "$(footer)" = 표시 ] && [ "$banner" = 표시 ] || ok=1
report TC-ADVERTISEMENT-001 $ok "설정 화면 진입 후 배너 영역 $(footer), 스켈레톤 $skeleton, 배너 $banner"

ok=0
tap settings-language
wait_for language-system
language_footer=$(footer)
tap modal-back
tap settings-more
wait_for more-privacy-policy
more_footer=$(footer)
{ [ "$language_footer" = 없음 ] && [ "$more_footer" = 없음 ]; } || ok=1
report TC-ADVERTISEMENT-003 $ok "언어 목록 배너 영역 $language_footer, 더보기 배너 영역 $more_footer"

ok=0
options=$([ -n "$(center more-privacy-options)" ] && echo 표시 || echo 없음)
[ "$options" = 없음 ] || ok=1
report TC-ADVERTISEMENT-006 $ok "더보기 화면 개인정보 옵션 행 $options"
tap modal-close

device shell cmd connectivity airplane-mode enable
changed_airplane=1
sleep 3
ok=0
tap settings
wait_for settings-language
sleep 5
dump_ui
offline_footer=$(footer)
[ "$offline_footer" = 없음 ] || ok=1
report TC-ADVERTISEMENT-004 $ok "비행기 모드 $(device shell settings get global airplane_mode_on | tr -d '\r')에서 설정 화면 진입 5초 후 배너 영역 $offline_footer"
tap modal-close
device shell cmd connectivity airplane-mode disable
changed_airplane=

clear_app
launch
ok=0
covered=0
for _ in 1 2 3 4 5; do
  dump_ui
  [ -n "$(center controls-play)" ] || covered=$((covered + 1))
  resumed_activity | grep -q "$PACKAGE/.MainActivity" || covered=$((covered + 1))
  sleep 1
done
[ "$covered" = 0 ] || ok=1
report TC-ADVERTISEMENT-005 $ok "앱 데이터 삭제 후 첫 실행 10초 동안 타이머 화면이 가려진 확인 횟수 $covered/10"
