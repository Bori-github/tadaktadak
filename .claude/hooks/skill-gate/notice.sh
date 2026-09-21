#!/bin/sh
# 세션 시작 때 gate.sh 가 요구하는 스킬을 미리 알림.

jq -n '{
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: "이 저장소는 .ts/.tsx 파일을 쓰기 전에 typescript-style-guide, code-quality 스킬 호출을 PreToolUse 훅으로 강제한다. Write·Edit 과 Bash 의 리다이렉션·tee·sed -i 를 막는다. 호출 없이 쓰면 도구 호출이 거부되므로 먼저 두 스킬을 호출한다."
  }
}'
