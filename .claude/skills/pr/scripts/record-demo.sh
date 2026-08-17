#!/usr/bin/env bash
# 실기기 화면을 녹화해 PR 첨부용 영상을 만든다.
# 사용법: .claude/skills/pr/scripts/record-demo.sh [출력 파일]
#
# 녹화는 Enter를 누르면 멈춘다. 중간에 끊겨도 EXIT trap이 마무리한다.
set -euo pipefail

OUT="${1:-demo.mp4}"
APP="com.boriguri.tadaktadak"

command -v pnpm >/dev/null || { echo "✘ pnpm 필요" >&2; exit 1; }

run() { pnpm dlx agent-device "$@"; }

cleanup() {
  run record stop >/dev/null 2>&1 || true
  run close >/dev/null 2>&1 || true
}
trap cleanup EXIT

run open "$APP" --foreground
run record start "$OUT"

echo ""
echo "녹화 중 — 아이폰에서 바뀐 동작을 조작한 뒤 Enter를 누르세요."
read -r _ || true

echo "✔ $OUT"
echo "  올리려면: .claude/skills/pr/scripts/upload-attachment.sh $OUT"
