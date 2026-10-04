# 실기기 테스트

배포 전 실기기 테스트를 실행하고 결과를 확인하는 방법을 플랫폼별로 둔다.

- 케이스: Notion [Test Cases](https://app.notion.com/p/qhflrnfl4324/Test-Cases-3ee426a38e86808099d2cdf9b1a39f0f)
- 회차별 결과: Notion [Test Run](https://app.notion.com/p/qhflrnfl4324/Test-Run-3ef426a38e86804699abf346a7416a5e)
- 번들 식별자: `com.boriguri.tadaktadak`

## Android

Play 내부 테스트로 설치한 앱을 `adb`로 조작하고, 시스템 기록으로 결과를 확인한다.

- 측정 기기: Galaxy S20+(SM-G986N), Android 13

### 연결

```sh
adb devices
adb mdns services                # 목록이 비면 _adb-tls-connect 주소 확인
adb connect <IP:포트>
```

### 조작

| 동작                | 명령                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| 앱 실행             | `adb shell monkey -p com.boriguri.tadaktadak -c android.intent.category.LAUNCHER 1` |
| 버튼 좌표           | `adb shell uiautomator dump /sdcard/ui.xml` 후 `resource-id`의 `bounds` 중심        |
| 탭                  | `adb shell input tap <x> <y>`                                                       |
| 백그라운드          | `adb shell input keyevent KEYCODE_HOME`                                             |
| 앱 강제 종료        | `adb shell am force-stop com.boriguri.tadaktadak`                                   |
| 알림창 열기         | `adb shell cmd statusbar expand-notifications`                                      |
| 알림창 닫기         | `adb shell cmd statusbar collapse`                                                  |
| 화면 캡처           | `adb exec-out screencap -p > <파일>.png`                                            |
| 방해 금지 켜기      | `adb shell cmd notification set_dnd on`                                             |
| 방해 금지 끄기      | `adb shell cmd notification set_dnd off`                                            |
| 화면 깨우기         | `adb shell input keyevent KEYCODE_WAKEUP`                                           |
| 화면 켜짐 유지 켜기 | `adb shell svc power stayon usb`                                                    |
| 화면 켜짐 유지 끄기 | `adb shell svc power stayon false`                                                  |
| 알림 권한 끄기      | `adb shell pm revoke com.boriguri.tadaktadak android.permission.POST_NOTIFICATIONS` |
| 알림 권한 켜기      | `adb shell pm grant com.boriguri.tadaktadak android.permission.POST_NOTIFICATIONS`  |

`uiautomator dump`의 `resource-id`는 `testID` 값과 같다(`controls-play`, `controls-stop`, `settings`).

### 결과 확인

| 항목                 | 명령                                        | 근거                                                                                                                |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 설치본               | `adb shell dumpsys package <패키지>`        | `versionCode`·`versionName`이 EAS 빌드 값과 같음. `installerPackageName=com.android.vending`이면 Play 설치본        |
| 벨소리 모드          | `adb shell dumpsys audio`                   | `Ringer mode:` 아래 `mode (external)` 값. `NORMAL` 소리, `VIBRATE` 진동, `SILENT` 무음                              |
| 방해 금지            | `adb shell settings get global zen_mode`    | 0 꺼짐. `set_dnd on` 직후 2                                                                                         |
| 알림 권한            | `adb shell dumpsys package <패키지>`        | `POST_NOTIFICATIONS: granted=true` 허용, `false` 거부                                                               |
| 잠금 상태            | `adb shell dumpsys window`                  | `isKeyguardShowing=true`면 잠금화면 표시 중                                                                         |
| 화면 상태            | `adb shell dumpsys power`                   | `mWakefulness=Awake` 켜짐, `Dozing`·`Asleep` 꺼짐                                                                   |
| 화면 꺼짐 방지       | `adb shell dumpsys window windows`          | 앱 창의 `fl=` 값에 `0x80`(`FLAG_KEEP_SCREEN_ON`) 비트. 대기 `81810100`, 진행 `81810180`                             |
| 진행 막대            | `adb shell dumpsys notification --noredact` | `id=1` 알림의 `android.progress`(경과 초)와 `android.progressMax`(타이머 길이 초)                                   |
| 알람 최소 간격       | `adb shell dumpsys alarm`                   | `min_futurity` 값. 앱이 예약한 알람은 이 값보다 빨리 울리지 않음. 이 기기 `+5s0ms`                                  |
| 실시간 업데이트 알림 | `adb shell dumpsys notification --noredact` | 진행 중 `id=1 channel=live-activity` 존재. 완료 후 제거                                                             |
| 완료 알림            | `adb shell dumpsys notification --noredact` | `tag=completion-<끝날 시각>` 알림 존재. `when=`(밀리초)이 시작 시각 + 타이머 시간과 같음                            |
| 완료 알림 누적       | `adb shell dumpsys notification --noredact` | 집중 완료·휴식 완료 최대 2개. 다음 집중 시작 시 이전 완료 알림 제거                                                 |
| 진동                 | `adb shell dumpsys vibrator_manager`        | 완료 시각의 `startTime` 기록과 `status: finished`. 아래 표의 `opPkg`·`Usage`로 경로 구분                            |
| 알림 소리            | `adb shell dumpsys notification`            | `mSoundNotificationKey`가 `null`이면 알림음 재생 없음. 진동을 낸 알림은 `mVibrateNotificationKey`에 키 기록         |
| 소리 재생            | `adb shell dumpsys audio`                   | `playback activity as reported through PlayerBase` 로그에 완료 시각의 `new player`·`state:started` 없으면 재생 없음 |

| 경로                  | `opPkg`                   | `Usage`        |
| --------------------- | ------------------------- | -------------- |
| 버튼 탭               | `com.boriguri.tadaktadak` | `TOUCH`        |
| 포그라운드 집중 완료  | `com.boriguri.tadaktadak` | `MEDIA`        |
| 포그라운드 휴식 완료  | `com.boriguri.tadaktadak` | `TOUCH`        |
| 백그라운드 완료(알림) | `android`                 | `NOTIFICATION` |

### 벨소리 모드 변경

벨소리 볼륨(`--stream 2`)을 바꿔 모드를 전환한다. 바꾼 뒤 `dumpsys audio`의 `mode (external)`로 확인한다.

| 모드 | 명령                                                    | 결과      |
| ---- | ------------------------------------------------------- | --------- |
| 소리 | `adb shell cmd media_session volume --stream 2 --set 5` | `NORMAL`  |
| 진동 | `adb shell cmd media_session volume --stream 2 --set 0` | `VIBRATE` |
| 무음 | 없음. 기기에서 변경                                     | `SILENT`  |

- 진동: 벨소리 볼륨 0에서 진동으로 바뀌는 기기 설정 기준. `NORMAL`에서 `--set 0` 실행 시 `VIBRATE` 확인
- 무음: `VIBRATE`에서 `input keyevent KEYCODE_VOLUME_MUTE`, `KEYCODE_VOLUME_DOWN`, `--adj lower` 모두 `VIBRATE` 유지
- `settings put global mode_ringer 2`: 설정값만 2로 바뀌고 `mode (external)`은 `VIBRATE` 유지

### 결과 확인에 사용하면 잘못되는 값

실제 동작과 일치하지 않아 근거에서 제외하는 값. 항목마다 대체 확인 수단 작성.

- `am force-stop` 중의 완료 알림
  - 강제 종료 시 Android가 앱이 예약한 알람과 알림을 삭제
  - 강제 종료 중 완료 알림 미수신은 종료 방식에 따른 결과로, 앱 결함에서 제외
- 화면 자동 꺼짐 대기
  - 자동 꺼짐 시간이 지나면 보안 잠금이 적용되어 이후 조작 불가
  - 화면 꺼짐 방지는 「결과 확인」 표의 앱 창 `FLAG_KEEP_SCREEN_ON` 플래그로 확인
- `dumpsys vibrator_manager`의 `scale`
  - 진동 모드에서 실제 재생된 진동도 `scale: 0.00`으로 기록
  - 진동 세기·재생 여부의 근거에서 제외. 재생 여부는 완료 시각의 `startTime` 기록과 `status: finished`로 확인
- 상태 표시줄의 벨소리 아이콘
  - 진동 모드 아이콘과 무음 모드 아이콘의 형태가 유사해 육안 구분 불가
  - 벨소리 모드는 `dumpsys audio`의 `mode (external)`로 확인
- `settings get global mode_ringer`
  - `settings put`으로 변경 시 설정값만 바뀌고 실제 벨소리 모드는 변경되지 않음
  - 벨소리 모드는 `dumpsys audio`의 `mode (external)`로 확인

### adb로 확인 불가

자동 실행에서 제외하고 사람이 수행하는 항목.

- 보안 잠금 해제
  - PIN·패턴 입력은 adb로 수행 불가
  - 보안 잠금 화면은 `screencap` 캡처 시 검은 화면이라 근거로 사용 불가
- 진동 촉감과 세기
  - `dumpsys vibrator_manager`에는 진동 요청 기록만 남고 실제 촉감·세기는 기록되지 않음
  - 기기를 든 사람이 확인
