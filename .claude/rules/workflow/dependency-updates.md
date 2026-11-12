# 의존성 업데이트

## dependabot PR 머지

- 한 번에 PR 하나만 머지. 머지 후 main CI 통과를 확인한 뒤 다음 PR에 `@dependabot rebase` 요청
- 리베이스 후 PR의 `package.json` 변경에서 대상 버전 재확인. 메이저 버전이 바뀌었으면 머지하지 않고 변경 기록 확인 후 보고
- `dependencies`의 메이저 버전 변경은 머지 전 iOS 시뮬레이터와 Android 에뮬레이터의 개발 빌드(`pnpm ios`, `pnpm android`)에서 `.maestro/smoke.yaml` 통과 확인
