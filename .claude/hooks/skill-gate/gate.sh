#!/bin/sh
# 필수 스킬 PreToolUse 게이트.
#
# .ts/.tsx 를 쓰기 전에 필수 스킬의 호출 기록을 대화 기록에서 확인. 호출 기록이 없는 스킬이 있으면 거부.
# src/ 아래 .ts/.tsx 는 test-driven-development 도 필수 스킬에 포함.
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

fields=$(printf '%s' "$payload" | jq -r '[.tool_input.file_path // "", .transcript_path // "", .agent_id // ""] | join("\u001f")')
# 탭은 IFS 공백이라 연속된 탭이 하나로 합쳐지고 빈 필드가 사라짐.
sep=$(printf '\037')
IFS="$sep" read -r file_path transcript agent_id <<FIELDS
$fields
FIELDS
# read 는 첫 줄만 읽어 여러 줄 명령이 뒤 필드를 비우므로 command 는 따로 추출
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

# 서브에이전트의 도구 호출에도 transcript_path 가 상위 세션 기록이라 agent_id 로 서브에이전트 기록 경로를 만듦
# 서브에이전트 기록 경로는 공식 문서에 없어 파일이 없으면 상위 세션 기록으로 확인
if [ -n "$agent_id" ]; then
  subagent_transcript="${transcript%.jsonl}/subagents/agent-$agent_id.jsonl"
  [ -r "$subagent_transcript" ] && transcript=$subagent_transcript
fi

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
      # cp 와 mv 는 마지막 인자가 목적지. 명령 구분자로 분리해 각 구간의 첫 토큰과 마지막 토큰만 검사
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

skills="typescript-style-guide code-quality"
relative_path=${file_path#"${CLAUDE_PROJECT_DIR%/}"/}
relative_path=${relative_path#./}
# CLAUDE_PROJECT_DIR 가 메인 저장소를 가리키면 워크트리 파일 경로에 .claude/worktrees/<이름>/ 접두사가 남아 src/ 판별 전에 제거
relative_path=${relative_path#.claude/worktrees/*/}
case "$relative_path" in
  src/*) skills="$skills test-driven-development" ;;
esac

# 슬래시 명령은 Skill 도구 호출이 아니라 사용자 메시지 문자열 안의 command-name 태그로 기록됨
# 도구 입력·결과에 포함된 같은 문자열을 호출로 판정하지 않도록 content 가 문자열인 사용자 메시지에서만 확인
is_skill_called() {
  # 패턴 원문에 [[:space:]] 가 들어가 자기 자신에는 매칭되지 않음.
  grep -qE "\"skill\"[[:space:]]*:[[:space:]]*\"$1\"" "$transcript" && return 0
  grep -F "<command-name>/$1</command-name>" "$transcript" \
    | jq -nRe --arg tag "<command-name>/$1</command-name>" \
      'any(inputs | fromjson? | select(.type == "user" and (.message.content | type) == "string"); .message.content | contains($tag))' >/dev/null
}

missing=""
for skill in $skills; do
  is_skill_called "$skill" || missing="$missing, $skill"
done

[ -z "$missing" ] && exit 0

jq -n --arg path "$file_path" --arg missing "${missing#, }" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ($path + " 는 .ts/.tsx 라 쓰기 전에 필수 스킬을 호출해야 한다. Skill 도구로 " + $missing + " 를 호출한 뒤 같은 작업을 다시 시도한다.")
  }
}'
