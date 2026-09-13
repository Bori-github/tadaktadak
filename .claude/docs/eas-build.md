# EAS Build 설정

```json
{
  "cli": {
    "version": ">= 24.3.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## cli

- `version`
  - 이 프로젝트에서 허용하는 EAS CLI 최소 버전
  - 더 낮은 버전으로 실행하면 명령이 거부(팀원 간 버전 차이로 생기는 문제를 막는 용도)
- `appVersionSource`
  - 빌드 번호를 어디서 관리할지 정함
    - remote: EAS 서버가 보관하고 app.json의 해당 값은 무시
    - local: app.json이 원본이고 빌드마다 바뀐 값을 직접 커밋
  - 여기서 말하는 빌드 번호는 iOS의 buildNumber와 Android의 versionCode으로 사용자에게 보이는 앱 버전은 해당하지 않음

## build

```bash
eas build --profile <이름>
```

- `development`
  - `developmentClient: true`
    - Expo 개발 클라이언트(`expo-dev-client`)를 넣은 디버그 빌드. iOS는 Debug 구성으로 컴파일
    - JS를 번들에 넣지 않고 Metro 서버(`pnpm start`)에서 받음. 코드를 고치면 빌드 없이 반영
    - `expo-dev-client`가 프로젝트에 설치돼 있어야 함. 이 프로젝트에는 없어서 이 프로필은 아직 쓰지 못함
  - `distribution: internal`
    - iOS는 ipa, Android는 apk 파일이 EAS 서버에 생성됨. 빌드 페이지의 설치 링크와 QR로 기기에 직접 설치
    - iOS는 Apple 계정에 등록된 기기에만 설치
      - 기기 등록: `eas device:create`
- `preview`
  - `distribution: internal`
    - `development`와 같은 설치 방식
  - `developmentClient`가 없으므로 JS를 번들에 넣은 릴리즈 빌드. Metro 서버 없이 실행
  - 스토어에 제출하기 전에 실제 기기에서 동작을 확인하는 용도
- `production`
  - `distribution`이 없으므로 기본값 `store`
    - App Store Connect에 제출하는 ipa. 기기에 직접 설치할 수 없어 설치 링크와 QR이 생기지 않음
    - 제출 명령은 `eas submit`
  - `autoIncrement: true`
    - 빌드마다 빌드 번호(iOS `buildNumber`, Android `versionCode`)가 1씩 증가
    - `appVersionSource`가 `remote`라 증가한 값은 EAS 서버에 보관되고 `app.json`은 바뀌지 않음

## submit

`eas submit`이 쓰는 설정

- 제출 대상은 `production` 프로필 빌드. `internal` 빌드는 서명이 달라 제출 불가
- `production`이 비어 있으면 `eas submit`이 업로드 전에 순서대로 물음
  1. Apple ID 입력
  2. App Store Connect 앱 확인. Apple에 로그인해 번들 식별자로 앱을 찾고, 없으면 이름을 물어 만듦. 이름 기본값은 `app.json`의 `name`
  3. 업로드 인증. 처음에 Apple 로그인으로 App Store Connect API 키를 만들어 EAS 서버에 보관하고 다음부터 재사용
- 1번과 2번을 건너뛰려면 앱을 만든 뒤 아래를 적음. `ascAppId`는 App Store Connect 앱 페이지 주소의 `apps/` 뒤 숫자

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "<Apple ID>",
      "ascAppId": "<App Store Connect 앱 번호>",
      "appleTeamId": "<Apple 팀 ID>"
    }
  }
}
```

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### 제출 후 App Store Connect

`eas submit`은 빌드를 App Store Connect에 넣는 것까지 진행하고, 심사 제출은 App Store Connect을 통해 웹에서 진행

1. 빌드 처리 대기. 10~15분 뒤 TestFlight 탭에 나타남
2. TestFlight로 아이폰에 설치해 확인. 스토어 서명이 붙은 실제 제출본
3. 앱 정보 입력. 이름, 부제, 카테고리, 개인정보 처리방침 주소, 연령 등급, 가격
4. 버전 페이지 작성. 스크린샷(6.9인치 한 세트 필수), 설명, 키워드, 지원 주소, 처리된 빌드 선택
5. 개인정보 수집 신고
6. 심사 제출

## 참고

- [eas.json 레퍼런스](https://docs.expo.dev/eas/json/)
- [앱 버전 관리](https://docs.expo.dev/build-reference/app-versions/)
