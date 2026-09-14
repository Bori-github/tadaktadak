# 실기기 설치

개발 빌드를 iPhone에 설치하는 절차

## 준비

- 케이블로 연결하고 화면 잠금을 푼다.
  - 잠겨 있으면 개발자 디스크 이미지가 마운트되지 않아 `Timed out waiting for all destinations`로 끝난다
- 기기 설정 → 개인정보 보호 및 보안 → 개발자 모드를 켠다
- Xcode → Settings → Apple Accounts에서 `Teams`에 팀이 보이는지 확인한다. 비어 있으면 프로파일을 새로 발급받지 못한다

## 설치

```sh
pnpm ios --device <UDID>
```

빌드, 설치, Metro 기동, 앱 실행까지 한 번에 한다.

`<UDID>` 자리에는 기기의 UDID를 넣는다. UDID는 `xcrun xctrace list devices`의 `== Devices ==` 아래 괄호 안 값이다.

## 인증서 신뢰

서명이 바뀐 뒤 첫 실행은 실패한다. 기기 설정 → 일반 → VPN 및 기기 관리 → 개발자 앱에서 계정을 선택해 신뢰한다.

## Metro

Debug 구성은 JS를 앱에 넣지 않고 실행 중에 Metro에서 받는다. 맥과 기기가 같은 네트워크에 있어야 하고, Metro를 끄면 앱도 멈춘다.

맥 없이 쓰려면 Release로 빌드한다.

```sh
pnpm ios --device <UDID> --configuration Release
```

## 프로파일이 만료됐을 때

`pnpm ios`는 `-allowProvisioningUpdates`를 붙이지 않아 프로파일을 새로 발급받지 못한다. 아래로 한 번 발급받은 뒤 평소 명령으로 돌아간다.

```sh
xcodebuild -workspace ios/app.xcworkspace -configuration Debug -scheme app \
  -destination id=<UDID> -allowProvisioningUpdates build
```

Xcode에서 `ios/app.xcworkspace`를 열고 ⌘R로 실행해도 된다. `app.xcodeproj`가 아니라 워크스페이스를 연다. `app`과 `widget` 두 타겟 모두 Signing & Capabilities에서 팀이 지정돼 있어야 한다.

발급된 프로파일은 `~/Library/Developer/Xcode/UserData/Provisioning Profiles/`에 있다. 만료일은 아래로 본다.

```sh
security cms -D -i <프로파일>.mobileprovision | plutil -extract ExpirationDate raw -
```

## 오류와 조치

| 메시지                                                 | 조치                                             |
| ------------------------------------------------------ | ------------------------------------------------ |
| `No device UDID or name matching`                      | `xcrun xctrace list devices`의 UDID를 쓴다       |
| `The developer disk image could not be mounted`        | 기기 화면 잠금을 푼다                            |
| `Unable to log in with account`                        | Xcode → Settings → Apple Accounts에서 로그인한다 |
| `No profiles for 'com.boriguri.tadaktadak' were found` | `-allowProvisioningUpdates`로 재발급받는다       |
| `its profile has not been explicitly trusted`          | 기기에서 개발자 앱을 신뢰한다                    |
