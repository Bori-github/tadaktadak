#!/bin/sh
# release/* 브랜치만 deploy-ios 워크플로 실행
# 사용: sh scripts/deploy/ios.sh <release/X.Y>
set -eu

REF=${1:-}

case "$REF" in
  release/*) ;;
  *)
    echo "사용: sh scripts/deploy/ios.sh <release/X.Y>" >&2
    exit 1
    ;;
esac

eas workflow:run .eas/workflows/deploy-ios.yml --ref "$REF"
