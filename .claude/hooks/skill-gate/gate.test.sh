#!/bin/sh
# skill-gate 회귀 검사.
#
# 실행: sh .claude/hooks/skill-gate/gate.test.sh

gate="$(dirname "$0")/gate.sh"
# 게이트 파일이 없으면 출력이 비고, 빈 출력은 통과와 구분되지 않음.
[ -r "$gate" ] || { echo "게이트를 찾을 수 없다: $gate" >&2; exit 1; }
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

skill_call() {
  jq -nc --arg n "$1" \
    '{type:"assistant",message:{content:[{type:"tool_use",name:"Skill",input:{skill:$n}}]}}'
}

{ skill_call typescript-style-guide; skill_call code-quality; } > "$work/called.jsonl"
{ skill_call typescript-style-guide; skill_call code-quality; skill_call test-driven-development; } > "$work/tdd-called.jsonl"
skill_call typescript-style-guide > "$work/style-guide-only.jsonl"
skill_call ko-dev-doc > "$work/not-called.jsonl"

pass=0
fail=0

check() {
  want=$1 got=$2 label=$3
  if [ "$want" = "$got" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    printf '  FAIL  %s\n        기대 %s, 실제 %s\n' "$label" "$want" "$got"
  fi
}

decision() {
  out=$(cat)
  if [ -z "$out" ]; then
    echo pass
  else
    printf '%s' "$out" | jq -r '.hookSpecificOutput.permissionDecision'
  fi
}

run_write() {
  jq -nc --arg t "$1" --arg f "$2" \
    '{tool_name:"Write",transcript_path:$t,tool_input:{file_path:$f,content:"x"}}' \
    | sh "$gate" | decision
}

deny_reason() {
  jq -nc --arg t "$1" --arg f "$2" \
    '{tool_name:"Write",transcript_path:$t,tool_input:{file_path:$f,content:"x"}}' \
    | sh "$gate" | jq -r '.hookSpecificOutput.permissionDecisionReason'
}

run_bash() {
  jq -nc --arg t "$1" --arg c "$2" \
    '{tool_name:"Bash",transcript_path:$t,tool_input:{command:$c}}' \
    | sh "$gate" | decision
}

E=$(printf '.%s' ts)
X=$(printf '.%s' tsx)

echo "Write·Edit"
check deny "$(run_write "$work/not-called.jsonl" "/x/a$E")"   "미호출 .ts 는 거부"
check deny "$(run_write "$work/not-called.jsonl" "/x/A$X")"   "미호출 .tsx 는 거부"
check pass "$(run_write "$work/not-called.jsonl" /x/a.md)"    ".md 는 통과"
check pass "$(run_write "$work/called.jsonl" "/x/a$E")"       "호출했으면 통과"
check pass "$(run_write "" "/x/a$E")"                         "기록 없으면 통과"

echo "필수 스킬 일부만 호출"
check deny "$(run_write "$work/style-guide-only.jsonl" "/x/a$E")" "typescript-style-guide 만 호출했으면 거부"
reason=$(deny_reason "$work/style-guide-only.jsonl" "/x/a$E")
case "$reason" in *code-quality*) named=yes ;; *) named=no ;; esac
check yes "$named" "거부 사유에 호출하지 않은 code-quality 표시"
case "$reason" in *typescript-style-guide*) named=yes ;; *) named=no ;; esac
check no "$named" "거부 사유에 호출한 typescript-style-guide 는 표시하지 않음"
reason=$(deny_reason "$work/not-called.jsonl" "/x/a$E")
case "$reason" in *"typescript-style-guide, code-quality"*) named=yes ;; *) named=no ;; esac
check yes "$named" "둘 다 호출하지 않았으면 거부 사유에 두 이름을 쉼표로 구분"

run_subagent_write() {
  jq -nc --arg t "$1" --arg a "$2" --arg f "$3" \
    '{tool_name:"Write",transcript_path:$t,agent_id:$a,tool_input:{file_path:$f,content:"x"}}' \
    | sh "$gate" | decision
}

mkdir -p "$work/session/subagents"
cp "$work/called.jsonl" "$work/session.jsonl"
cp "$work/not-called.jsonl" "$work/session/subagents/agent-parent-only.jsonl"
cp "$work/called.jsonl" "$work/session/subagents/agent-self.jsonl"

echo "서브에이전트"
check pass "$(run_subagent_write "$work/session.jsonl" self "/x/a$E")"        "서브에이전트 기록에 호출이 있으면 통과"
check deny "$(run_subagent_write "$work/session.jsonl" parent-only "/x/a$E")" "상위 세션 기록에만 호출이 있으면 거부"
check pass "$(run_subagent_write "$work/session.jsonl" missing "/x/a$E")"     "서브에이전트 기록이 없으면 통과"

echo "Bash: 막아야 하는 것"
for c in "cat > src/a$E <<EOF" "cat > src/T$X <<EOF" "printf x > src/a$E" \
         "echo x >> src/a$E" "tee src/a$E" "tee -a src/a$E" \
         "sed -i '' s/a/b/ src/a$E" "perl -i -pe s/a/b/ src/a$E" \
         "cp /tmp/probe$E src/a$E" "mv /tmp/probe$E src/a$E" \
         "cp scratch/T$X src/T$X" "mkdir -p src && cp /tmp/probe$E src/a$E"; do
  check deny "$(run_bash "$work/not-called.jsonl" "$c")" "$c"
done

echo "Bash: 통과해야 하는 것"
for c in "cat src/a$E" "grep -n foo src/a$E" "pnpm tsc --noEmit" \
         "wc -l src/a$E > /tmp/counts.txt" "cat > /tmp/probe$E <<EOF" \
         "cat > node_modules/x/a$E <<EOF" "cat > docs/note.md <<EOF" \
         "git diff -- src/a$E" "grep -rn 'cat > src/a$E' docs" \
         "cp src/a$E /tmp/backup$E" "cp src/a$E node_modules/x/a$E" \
         "cp -r src/widgets /tmp/backup"; do
  check pass "$(run_bash "$work/not-called.jsonl" "$c")" "$c"
done

echo "Bash: 호출한 뒤에는 통과"
check pass "$(run_bash "$work/tdd-called.jsonl" "cat > src/a$E <<EOF")" "호출했으면 Bash 쓰기도 통과"

echo "src/ 아래 .ts/.tsx"
export CLAUDE_PROJECT_DIR=/proj
check deny "$(run_write "$work/called.jsonl" "/proj/src/a$E")"              "test-driven-development 를 호출하지 않았으면 거부"
reason=$(deny_reason "$work/called.jsonl" "/proj/src/a$E")
case "$reason" in *test-driven-development*) named=yes ;; *) named=no ;; esac
check yes "$named" "거부 사유에 test-driven-development 표시"
check pass "$(run_write "$work/tdd-called.jsonl" "/proj/src/a$E")"          "세 스킬을 모두 호출했으면 통과"
check pass "$(run_write "$work/called.jsonl" "/proj/modules/x/src/a$E")"    "modules/ 아래 .ts 는 test-driven-development 를 호출하지 않아도 통과"
check deny "$(run_bash "$work/called.jsonl" "cat > src/a$E <<EOF")"         "Bash 로 src/ 아래 .ts 를 쓸 때도 거부"

printf '\n통과 %d, 실패 %d\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
