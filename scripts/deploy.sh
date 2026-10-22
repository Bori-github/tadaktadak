#!/bin/sh
# release/* 브랜치만 플랫폼별 deploy 워크플로 실행
# 사용: sh scripts/deploy.sh <ios|android> <release/X.Y>
set -eu

PLATFORM=${1:-}
REF=${2:-}
USAGE="사용: sh scripts/deploy.sh <ios|android> <release/X.Y>"

case "$PLATFORM" in
  ios | android) ;;
  *)
    echo "$USAGE" >&2
    exit 1
    ;;
esac

case "$REF" in
  release/*) ;;
  *)
    echo "$USAGE" >&2
    exit 1
    ;;
esac

eas workflow:run ".eas/workflows/deploy-$PLATFORM.yml" --ref "$REF"
