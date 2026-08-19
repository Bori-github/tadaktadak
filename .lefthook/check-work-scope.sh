#!/bin/sh
# 변경 크기 검사. 첫 인자가 모드
#   commit      lefthook pre-commit
#   push        lefthook pre-push
set -u

COMMIT_MAX=200
COMMIT_MAX_FILES=8
PR_TARGET=400
PR_MAX=600
BASE_BRANCH=main
RULE=".claude/rules/workflow/work-scope.md"

# 집계 제외 경로
is_excluded() {
  case "$1" in
    pnpm-lock.yaml) return 0 ;;
  esac
  return 1
}

# 변경된 파일의 줄 수와 파일 수 계산
sum_lines_and_files() {
  lines=0
  files=0
  while IFS="$(printf '\t')" read -r added deleted path; do
    [ -n "${path:-}" ] || continue
    is_excluded "$path" && continue
    files=$((files + 1))
    [ "$added" = "-" ] && continue
    lines=$((lines + added + deleted))
  done
  echo "$lines $files"
}

fail_message() {
  printf '%s\n규칙: %s\n' "$1" "$RULE" >&2
  exit 1
}

# 커밋 크기 검사
check_commit_size() {
  set -- $(git diff --cached --numstat | sum_lines_and_files)
  lines=$1
  files=$2
  fix="git add -p 로 목적별로 나눈다. 정당한 예외는 LEFTHOOK_EXCLUDE=work-scope git commit"
  [ "$files" -gt "$COMMIT_MAX_FILES" ] && fail_message "변경 크기: 커밋 ${files}개 파일. 상한 ${COMMIT_MAX_FILES}개.
$fix"
  [ "$lines" -gt "$COMMIT_MAX" ] && fail_message "변경 크기: 커밋 ${lines}줄, ${files}개 파일. 상한 ${COMMIT_MAX}줄.
$fix"
  exit 0
}

# 브랜치 전체 크기(목표·상한)와 각 커밋별 크기(--amend, fixup, rebase로 커진 커밋) 검사
check_branch_size() {
  ref_name=$1
  sha=$2
  base="origin/$BASE_BRANCH"

  git merge-base "$base" "$sha" >/dev/null 2>&1 || {
    echo "work-scope: $ref_name 은 $base 와 공통 조상이 없어 검사하지 않는다" >&2
    return 0
  }

  bad=""
  for c in $(git rev-list --no-merges "$base..$sha"); do
    set -- $(git show --numstat --format= "$c" | sum_lines_and_files)
    if [ "$1" -gt "$COMMIT_MAX" ] || [ "$2" -gt "$COMMIT_MAX_FILES" ]; then
      bad="$bad
  $(git log -1 --format='%h %s' "$c") — ${1}줄, ${2}개 파일"
    fi
  done
  [ -z "$bad" ] || fail_message "변경 크기: 커밋 상한(${COMMIT_MAX}줄, ${COMMIT_MAX_FILES}개 파일)을 넘는 커밋이 있다.$bad
git rebase -i 로 나눈다. 정당한 예외는 LEFTHOOK_EXCLUDE=work-scope git push"

  set -- $(git diff --numstat "$base...$sha" | sum_lines_and_files)
  lines=$1
  files=$2
  [ "$lines" -le "$PR_TARGET" ] && return 0
  if [ "$lines" -le "$PR_MAX" ]; then
    echo "변경 크기: PR($ref_name) ${lines}줄, ${files}개 파일. 목표 ${PR_TARGET}줄을 넘었다. 상한은 ${PR_MAX}줄." >&2
    return 0
  fi
  fail_message "변경 크기: PR($ref_name) ${lines}줄, ${files}개 파일. 상한 ${PR_MAX}줄.
변경을 나눈다. 정당한 예외는 LEFTHOOK_EXCLUDE=work-scope git push"
}

check_push() {
  git fetch --quiet origin "$BASE_BRANCH" 2>/dev/null || true
  git rev-parse --verify --quiet "origin/$BASE_BRANCH" >/dev/null || {
    echo "work-scope: origin/$BASE_BRANCH 가 없어 검사하지 않는다" >&2
    exit 0
  }

  # pre-push 표준 입력: <local ref> <local sha> <remote ref> <remote sha> (lefthook use_stdin)
  # 표준 입력이 비어 있으면(훅이 아니라 직접 실행) 현재 브랜치 검사
  seen=0
  while read -r local_ref local_sha remote_ref remote_sha; do
    [ -n "${local_ref:-}" ] || continue
    seen=1
    case "$local_sha" in 0000000000000000000000000000000000000000) continue ;; esac  # 삭제
    case "$local_ref" in refs/tags/*) continue ;; esac
    check_branch_size "${local_ref#refs/heads/}" "$local_sha"
  done
  [ "$seen" -eq 1 ] || check_branch_size "$(git rev-parse --abbrev-ref HEAD)" HEAD
  exit 0
}

case "${1:-commit}" in
  commit) check_commit_size ;;
  push) check_push ;;
  *) echo "usage: check-work-scope.sh commit|push" >&2; exit 1 ;;
esac
