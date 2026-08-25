#!/bin/sh
# typescript-style-guide 게이트 회귀 검사.
#
# 실행: sh .claude/hooks/typescript-style-guide/gate.test.sh

gate="$(dirname "$0")/gate.sh"
# 게이트 파일이 없으면 출력이 비고, 빈 출력은 통과와 구분되지 않음.
[ -r "$gate" ] || { echo "게이트를 찾을 수 없다: $gate" >&2; exit 1; }
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

jq -nc --arg n "typescript-style-guide" \
  '{type:"assistant",message:{content:[{type:"tool_use",name:"Skill",input:{skill:$n}}]}}' > "$work/called.jsonl"
jq -nc --arg n "ko-dev-doc" \
  '{type:"assistant",message:{content:[{type:"tool_use",name:"Skill",input:{skill:$n}}]}}' > "$work/not-called.jsonl"

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

echo "Bash: 막아야 하는 것"
for c in "cat > src/a$E <<EOF" "cat > src/T$X <<EOF" "printf x > src/a$E" \
         "echo x >> src/a$E" "tee src/a$E" "tee -a src/a$E" \
         "sed -i '' s/a/b/ src/a$E" "perl -i -pe s/a/b/ src/a$E"; do
  check deny "$(run_bash "$work/not-called.jsonl" "$c")" "$c"
done

echo "Bash: 통과해야 하는 것"
for c in "cat src/a$E" "grep -n foo src/a$E" "pnpm tsc --noEmit" \
         "wc -l src/a$E > /tmp/counts.txt" "cat > /tmp/probe$E <<EOF" \
         "cat > node_modules/x/a$E <<EOF" "cat > docs/note.md <<EOF" \
         "git diff -- src/a$E" "grep -rn 'cat > src/a$E' docs"; do
  check pass "$(run_bash "$work/not-called.jsonl" "$c")" "$c"
done

echo "Bash: 호출한 뒤에는 통과"
check pass "$(run_bash "$work/called.jsonl" "cat > src/a$E <<EOF")" "호출했으면 Bash 쓰기도 통과"

printf '\n통과 %d, 실패 %d\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
