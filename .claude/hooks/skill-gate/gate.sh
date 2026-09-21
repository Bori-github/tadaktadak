#!/bin/sh
# typescript-style-guide PreToolUse 게이트.
#
# .ts/.tsx 를 쓰기 전에 스킬을 불렀는지 대화 기록에서 확인. 부르지 않았으면 거부.
#
# 대상을 찾는 곳: > >> &> tee sed -i perl -i 와 cp mv 의 마지막 인자
# node -e, python3 -c, pnpm codegen 은 명령 문자열만으로 대상을 알 수 없음.
# 대상을 찾지 못하면 통과 (fail-open).

[ "${TADAK_SKIP_STYLE_GUIDE_GATE:-0}" = "1" ] && exit 0

payload=$(cat)

case "$payload" in
  *'.ts'*) ;;
  *) exit 0 ;;
esac

# > tee sed -i 가 없는 Bash 호출에서 jq 를 띄우지 않음.
case "$payload" in
  *'"file_path"'*) ;;
  *'>'*|*'tee '*|*'sed -i'*|*'perl -i'*|*'cp '*|*'mv '*) ;;
  *) exit 0 ;;
esac

fields=$(printf '%s' "$payload" | jq -r '[.tool_input.file_path // "", .tool_input.command // "", .transcript_path // ""] | join("\u001f")')
# 탭은 IFS 공백이라 연속된 탭이 하나로 합쳐지고 빈 필드가 사라짐.
sep=$(printf '\037')
IFS="$sep" read -r file_path command transcript <<FIELDS
$fields
FIELDS

if [ -z "$file_path" ] && [ -n "$command" ]; then
  file_path=$(printf '%s' "$command" | awk '
    { line = $0
      gsub(/\047[^\047]*\047/, " ", line)
      gsub(/"[^"]*"/, " ", line)
      gsub(/>/, " > ", line)
      n = split(line, t, /[ \t]+/)
      inplace = 0; editor = 0
      for (i = 1; i <= n; i++) {
        if (t[i] ~ /^(sed|perl|ruby)$/) editor = 1
        if (editor && t[i] ~ /^-i/) inplace = 1
        if (inplace && t[i] ~ /\.tsx?$/) { print t[i]; continue }
        if (t[i] == ">" || t[i] == "tee" || t[i] == "-a")
          if (t[i+1] ~ /\.tsx?$/) print t[i+1]
      }
      # cp 와 mv 는 마지막 인자가 목적지. 명령 구분자로 끊어 각 구간의 첫 낱말과 끝 낱말만 본다
      gsub(/&&|\|\||;|\|/, "\n", line)
      m = split(line, seg, /\n/)
      for (s = 1; s <= m; s++) {
        k = split(seg[s], u, /[ \t]+/)
        head = ""; tail = ""
        for (i = 1; i <= k; i++) {
          if (u[i] == "") continue
          if (head == "") head = u[i]
          tail = u[i]
        }
        sub(/^.*\//, "", head)
        if (head == "cp" || head == "mv")
          if (tail ~ /\.tsx?$/) print tail
      }
    }' | grep -vE '^/(private/)?tmp/|^/var/folders/|node_modules/|/build/|/dist/|/[.]expo/' | head -1)
fi

case "$file_path" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

[ -r "$transcript" ] || exit 0

# 패턴 원문에 [[:space:]] 가 들어가 자기 자신에는 매칭되지 않음.
if grep -qE '"skill"[[:space:]]*:[[:space:]]*"typescript-style-guide"' "$transcript"; then
  exit 0
fi

jq -n --arg path "$file_path" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ($path + " 는 .ts/.tsx 라 스타일 가이드를 먼저 읽어야 한다. Skill 도구로 typescript-style-guide 를 호출한 뒤 같은 작업을 다시 시도한다.")
  }
}'
