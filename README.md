# 타닥타닥

집중할 땐 은은하게 밝아지고, 쉴 땐 차분하게 어두워져요.
집중할 시간과 휴식할 시간을 설정하고, 타이머를 시작하면 돼요.

<p>
  <img src="store/ios/screenshots/ko/01-timer-setting.png" width="200">
  <img src="store/ios/screenshots/ko/02-focus-running.png" width="200">
  <img src="store/ios/screenshots/ko/03-focus-done-rest.png" width="200">
  <img src="store/ios/screenshots/ko/04-lock-screen.png" width="200">
</p>

## 실행

Node.js 22.23.2, pnpm 10 기준.

```bash
pnpm install
cp .env.example .env   # EXPO_APPLE_TEAM_ID 입력
pnpm ios               # iOS 시뮬레이터 개발 빌드
pnpm android           # Android 에뮬레이터 개발 빌드
```

## 스택

| 항목       | 값                                                             |
| ---------- | -------------------------------------------------------------- |
| 프레임워크 | Expo SDK 57, React Native 0.86                                 |
| 렌더링     | `@shopify/react-native-skia`, `react-native-reanimated`        |
| 위젯       | SwiftUI Widget Extension (`targets/`), `@bacons/apple-targets` |
| 아키텍처   | Feature-Sliced Design                                          |
| 빌드·배포  | EAS Build, EAS Submit                                          |
