# 타닥타닥 작업 계획

## 작업 계획

시안 `design/prototype.html`의 코드를 재료로 쓴다.

### 초기 세팅

- [ ] 프로젝트 생성
- [ ] 패키지 설치 (Expo SDK 버전에 맞춤)
  - `expo-notifications` 로컬 알림이 Expo Go에서 동작하는지 첫날 확인한다
- [ ] 팔레트와 수치 상수 파일. 상수는 `DESIGN.md` §7의 확정값 4개만 두고 나머지는 계산한다
- [ ] 빈 Widget Extension 타겟과 App Group으로 prebuild·서명·설치 확인 (무료 Apple ID, Intel Mac 빌드 시간). 되지 않으면 Apple Developer Program을 앞당긴다

### 기능·화면 구현 (Expo Go)

- [ ] 반응형 계산과 시계판 좌표
- [ ] 정적 화면 배치 (시계판, 숫자, 조작 버튼)
- [ ] 손잡이 조작(각도는 worklet에서 계산), 숫자 탭으로 편집 대상 전환
- [ ] 시간 모델 (남은 시간 계산, 저장값, 상태 전이 시 처리, 앱 재실행)
- [ ] 움직임 (호·손잡이·숫자, 차오름, 불꽃·불티·스파크)
- [ ] 그림 자산. 시안의 문자열 격자를 옮긴다
- [ ] 불꽃, 불티, 빛 번짐, 완료 연출. 빛 번짐은 반지름별 텍스처를 앱 시작 때 한 번 만들고 알파·스케일만 바꿔 그린다
- [ ] 휴식 타이머와 자동 시작
- [ ] 소리, 진동, 화면 꺼짐 방지
  - 진동 약·강을 `expo-haptics`의 어느 상수로 할지 실기기로 정한다
- [ ] 알림 (예약, 취소, 권한)
  - 알림 문구와 권한 거부 안내 문구를 정한다
- [ ] 화면 회전 대응
  - 가로 지원 여부를 정한다. 지원하면 가로 배치를 `DESIGN.md`에 적는다
- [ ] 검증
  - 단위 테스트는 Jest, E2E는 Maestro. 단위 테스트는 `now`와 저장값을 인자로 받는 순수 함수를 대상으로 한다
  - [ ] 남은 시간 계산 — 정상·0·음수 클램프, 시스템 시각 변경 무시 (단위)
  - [ ] 점화 판정 — `DESIGN.md` §8 표의 세 분기와 경계 (단위)
  - [ ] 앱 재실행 — `SPEC.md` 앱 재실행 표 4행, 끝날 시각이 지금과 같은 경계, 정지됨 플래그 (단위)
  - [ ] 상태 전이 시 처리 — 진행 진입·이탈에서 알림·Live Activity·화면 꺼짐 방지 호출 (단위)
  - [ ] 반응형 — 계산 순서의 구간 경계(338·359·360·390)와 겹침 검산, 화면 높이별 버튼 위치 (단위)
  - [ ] 한 바퀴 — 1분 집중 → 완료 연출 → 5초 → 휴식 → 대기. 재생 연타는 한 번만 시작 (E2E)
  - [ ] 진행 중 종료 → 재실행 — 남은 시간이 이어지는가. 휴식 도중 종료도 (E2E)
  - [ ] 백그라운드 복귀 — 돌아온 뒤 남은 시간이 맞는가 (E2E)
  - [ ] 진행 중 손잡이 드래그 — 무시되는가 (E2E)
  - [ ] 권한 거부 — 타이머가 끝까지 돌고, 문구를 탭하면 시스템 설정이 열리는가 (E2E)
  - [ ] 터치 — 두 버튼과 숫자 탭 영역이 겹치지 않는가 (E2E)
  - [ ] 진동 세기, 알림 도착 (실기기)

### Live Activity (개발 빌드)

- [ ] 개발 빌드 전환 (서명). 120Hz 설정 (`app.json` `ios.infoPlist`의 `CADisableMinimumFrameDurationOnPhone`)
- [ ] Widget Extension 타겟 추가와 앱 연결 (`@bacons/apple-targets`)
  - 실시간 현황 스위치가 켜져 있는지 확인하는 방법을 정한다
- [ ] ActivityKit 브리지 모듈 (Expo 로컬 모듈, Swift와 TypeScript). 시작·종료, App Group의 정지됨 플래그 읽기
- [ ] Live Activity 화면 (SwiftUI. 아이콘, 남은 시간, 진행 막대, 정지 버튼)
- [ ] 정지 버튼 App Intent (Swift). 알림 취소, Live Activity 종료, 정지됨 플래그 쓰기
- [ ] 상태 전달과 시작·일시정지·종료 연동
- [ ] 실기기 검증 (Live Activity 표시, 정지 버튼 → 앱 재실행 시 대기, 스와이프 해제)

## 개발 환경

### 현재 환경

| 항목    | 값                                       |
| ------- | ---------------------------------------- |
| 모델    | MacBookPro16,1 (2019년 16인치, Intel i9) |
| macOS   | 26.6.1 Tahoe                             |
| Xcode   | 26.6 (17F113), Universal                 |
| iOS SDK | 26.5                                     |
| Node.js | 22.23.2                                  |

- Xcode 26.6이 이 기계에서 돌아가는 마지막 정식 빌드다. Xcode 27부터 Universal 빌드를 내놓지 않는다

### Expo Go

- iPhone에 Expo Go를 설치하고 Mac에서 개발 서버를 켜면 같은 와이파이에서 QR 코드로 실행된다

Expo SDK 57 기준. `npx expo install`이 SDK에 맞는 버전을 고른다.

| 패키지                                      | 버전    | 역할                                   | Expo Go               |
| ------------------------------------------- | ------- | -------------------------------------- | --------------------- |
| `expo`                                      | 57.0.14 | SDK                                    | —                     |
| `@shopify/react-native-skia`                | 2.6.2   | 렌더링                                 | 포함됨                |
| `react-native-reanimated`                   | 4.5.1   | 애니메이션                             | 포함됨                |
| `react-native-gesture-handler`              | 2.32.0  | 제스처                                 | 포함됨                |
| `expo-haptics`                              | 57.0.1  | 진동                                   | 포함됨                |
| `expo-audio`                                | 57.0.3  | 소리와 오디오 세션                     | 포함됨                |
| `expo-keep-awake`                           | 57.0.1  | 화면 꺼짐 방지                         | 포함됨                |
| `@react-native-async-storage/async-storage` | 2.2.0   | 영속 저장                              | 포함됨                |
| `expo-notifications` 로컬 알림              | 57.0.12 | 종료 알림                              | 사용 가능             |
| Widget Extension (SwiftUI)                  | —       | Live Activity                          | **불가능. 개발 빌드** |
| ActivityKit 브리지 (Expo 로컬 모듈)         | —       | Live Activity 시작·종료, 정지됨 플래그 | **불가능. 개발 빌드** |

### 개발 빌드

- `@bacons/apple-targets`: `targets/` 폴더의 SwiftUI 코드를 prebuild 때 Widget Extension 타겟으로 붙여 준다. Xcode 16 이상을 요구한다

| 서명                    | 비용      | 기기 직접 설치       | TestFlight | App Store |
| ----------------------- | --------- | -------------------- | ---------- | --------- |
| 무료 Apple ID           | 없음      | 가능. 7일마다 재설치 | 불가       | 불가      |
| Apple Developer Program | 연 99달러 | 가능. 1년            | 가능       | 가능      |

### Android

- 개발 빌드가 필요 없다. Expo Go로 개발·검증한다
