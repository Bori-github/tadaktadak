#!/usr/bin/env bash
# GitHub 자산 CDN에 파일을 올리고 마크다운용 주소를 출력한다(커밋 없이).
# 사용법: .claude/skills/pr/scripts/upload-attachment.sh <파일>
#
# 저장소에 바이너리를 커밋하지 않고 PR에 영상·스크린샷을 붙이는 경로다.
# 한번 올린 파일은 CDN에서 지울 수 없다. 화면에 다른 것이 비쳤는지 먼저 본다.
set -euo pipefail

FILE="${1:?사용법: .claude/skills/pr/scripts/upload-attachment.sh <파일>}"
[ -f "$FILE" ] || { echo "✘ 파일 없음: $FILE" >&2; exit 1; }

SKILL_SCRIPTS="$HOME/.claude/skills/uploading-attachments/scripts"
PROFILE="$HOME/.claude/browser-profiles/github"
SESSION="gh-upload"

command -v jq >/dev/null || { echo "✘ jq 필요: brew install jq" >&2; exit 1; }
command -v agent-browser >/dev/null || { echo "✘ agent-browser 필요: npm i -g agent-browser" >&2; exit 1; }
[ -x "$SKILL_SCRIPTS/upload-image.sh" ] || { echo "✘ uploading-attachments 스킬을 찾을 수 없습니다: $SKILL_SCRIPTS" >&2; exit 1; }

INFO=$(bash "$SKILL_SCRIPTS/get-repo-info.sh")
REPO_ID=$(echo "$INFO" | jq -r .repo_id)
REPO_URL=$(echo "$INFO" | jq -r .repo_url)

agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
agent-browser --session "$SESSION" --profile "$PROFILE" open "$REPO_URL" >/dev/null 2>&1

if agent-browser --session "$SESSION" snapshot -i 2>/dev/null | grep -q 'link "Sign in"'; then
  echo "✘ GitHub 로그인이 필요합니다. 한 번만 아래를 실행하면 프로필에 저장됩니다:" >&2
  echo "    agent-browser --session $SESSION --headed --profile $PROFILE open https://github.com/login" >&2
  echo "    (로그인 후) agent-browser --session $SESSION close" >&2
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
  exit 1
fi

RESULT=$(bash "$SKILL_SCRIPTS/upload-image.sh" "$REPO_ID" "$SESSION" "$FILE")
agent-browser --session "$SESSION" close >/dev/null 2>&1 || true

HREF=$(echo "$RESULT" | jq -r '.[0].href // empty')
[ -n "$HREF" ] || { echo "✘ 업로드 실패: $RESULT" >&2; exit 1; }

echo "$HREF"
