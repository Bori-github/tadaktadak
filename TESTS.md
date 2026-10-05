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

| 동작                | 명령                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| 앱 실행             | `adb shell monkey -p com.boriguri.tadaktadak -c android.intent.category.LAUNCHER 1`                |
| 버튼 좌표           | `adb shell uiautomator dump /sdcard/ui.xml` 후 `resource-id`의 `bounds` 중심                       |
| 탭                  | `adb shell input tap <x> <y>`                                                                      |
| 백그라운드          | `adb shell input keyevent KEYCODE_HOME`                                                            |
| 앱 종료             | 최근 앱(`input keyevent KEYCODE_APP_SWITCH`)에서 앱 카드를 위로 `input swipe`. 예약 알람·알림 유지 |
| 앱 강제 종료        | `adb shell am force-stop com.boriguri.tadaktadak`                                                  |
| 알림창 열기         | `adb shell cmd statusbar expand-notifications`                                                     |
| 알림창 닫기         | `adb shell cmd statusbar collapse`                                                                 |
| 화면 캡처           | `adb exec-out screencap -p > <파일>.png`                                                           |
| 방해 금지 켜기      | `adb shell cmd notification set_dnd on`                                                            |
| 방해 금지 끄기      | `adb shell cmd notification set_dnd off`                                                           |
| 화면 깨우기         | `adb shell input keyevent KEYCODE_WAKEUP`                                                          |
| 잠금 해제           | `adb shell wm dismiss-keyguard`. 보안 잠금(PIN·패턴)은 해제 불가                                   |
| 화면 켜짐 유지 켜기 | `adb shell svc power stayon true`                                                                  |
| 화면 켜짐 유지 끄기 | `adb shell svc power stayon false`                                                                 |
| 알림 권한 끄기      | `adb shell pm revoke com.boriguri.tadaktadak android.permission.POST_NOTIFICATIONS`                |
| 알림 권한 켜기      | `adb shell pm grant com.boriguri.tadaktadak android.permission.POST_NOTIFICATIONS`                 |

`uiautomator dump`의 `resource-id`는 `testID` 값과 같다(`controls-play`, `controls-stop`, `settings`).

### 결과 확인

| 항목                 | 명령                                        | 근거                                                                                                                                    |
| -------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 설치본               | `adb shell dumpsys package <패키지>`        | `versionCode`·`versionName`이 EAS 빌드 값과 같음. `installerPackageName=com.android.vending`이면 Play 설치본                            |
| 벨소리 모드          | `adb shell dumpsys audio`                   | `Ringer mode:` 아래 `mode (external)` 값. `NORMAL` 소리, `VIBRATE` 진동, `SILENT` 무음                                                  |
| 방해 금지            | `adb shell settings get global zen_mode`    | 0 꺼짐. `set_dnd on` 직후 2                                                                                                             |
| 알림 권한            | `adb shell dumpsys package <패키지>`        | `POST_NOTIFICATIONS: granted=true` 허용, `false` 거부                                                                                   |
| 잠금 상태            | `adb shell dumpsys window`                  | `isKeyguardShowing=true`면 잠금화면 표시 중                                                                                             |
| 화면 상태            | `adb shell dumpsys power`                   | `mWakefulness=Awake` 켜짐, `Dozing`·`Asleep` 꺼짐                                                                                       |
| 화면 꺼짐 방지       | `adb shell dumpsys window windows`          | 앱 창의 `fl=` 값에 `0x80`(`FLAG_KEEP_SCREEN_ON`) 비트. 대기 `81810100`, 진행 `81810180`                                                 |
| 진행 막대            | `adb shell dumpsys notification --noredact` | `id=1` 알림의 `android.progress`(경과 초)와 `android.progressMax`(타이머 길이 초)                                                       |
| 알람 최소 간격       | `adb shell dumpsys alarm`                   | `min_futurity` 값. 앱이 예약한 알람은 이 값보다 빨리 울리지 않음. 이 기기 `+5s0ms`                                                      |
| 실시간 업데이트 알림 | `adb shell dumpsys notification --noredact` | 진행 중 `id=1 channel=live-activity` 존재. 완료 후 제거                                                                                 |
| 완료 알림            | `adb shell dumpsys notification --noredact` | `tag=completion-<끝날 시각>` 알림 존재. `when=`(밀리초)이 시작 시각 + 타이머 시간과 같음                                                |
| 완료 알림 누적       | `adb shell dumpsys notification --noredact` | 집중 완료·휴식 완료 최대 2개. 다음 집중 시작 시 이전 완료 알림 제거                                                                     |
| 진동                 | `adb shell dumpsys vibrator_manager`        | 완료 시각의 `startTime` 기록. `status`가 `cancelled*`·`ignored*`이면 재생되지 않은 진동으로 제외. 아래 표의 `opPkg`·`Usage`로 경로 구분 |
| 알림 소리            | `adb shell dumpsys notification`            | `mSoundNotificationKey`가 `null`이면 알림음 재생 없음. 진동을 낸 알림은 `mVibrateNotificationKey`에 키 기록                             |
| 소리 재생            | `adb shell dumpsys audio`                   | `playback activity as reported through PlayerBase` 로그에 완료 시각의 `new player`·`state:started` 없으면 재생 없음                     |

| 경로                  | `opPkg`                   | `Usage`        |
| --------------------- | ------------------------- | -------------- |
| 버튼 탭               | `com.boriguri.tadaktadak` | `TOUCH`        |
| 포그라운드 집중 완료  | `com.boriguri.tadaktadak` | `MEDIA`        |
| 포그라운드 휴식 완료  | `com.boriguri.tadaktadak` | `TOUCH`        |
| 백그라운드 완료(알림) | `android`                 | `NOTIFICATION` |

### 벨소리 모드 변경

오디오 시스템 서비스(`audio`)의 벨소리 모드 메서드를 `adb shell service call`로 직접 호출해 전환한다. 볼륨 키와 `cmd media_session volume`으로는 진동에서 무음으로 전환되지 않는다.

#### 전환

| 모드 | 명령                                                          | `dumpsys audio`의 `mode (external)` |
| ---- | ------------------------------------------------------------- | ----------------------------------- |
| 소리 | `adb shell service call audio 34 i32 2 s16 com.android.shell` | `NORMAL`                            |
| 진동 | `adb shell service call audio 34 i32 1 s16 com.android.shell` | `VIBRATE`                           |
| 무음 | `adb shell service call audio 34 i32 0 s16 com.android.shell` | `SILENT`                            |

- `34`: 호출할 메서드의 번호. 아래 「기능 번호」 참고
- `i32 0|1|2`: 벨소리 모드 값. 0 무음, 1 진동, 2 소리
- `s16 com.android.shell`: 호출자 패키지 이름
- 전환 후 `adb shell dumpsys audio`의 `Ringer mode:` 아래 `mode (external)` 값으로 결과 확인

#### 현재 모드 읽기

- `adb shell service call audio 36`
- 결과 `Result: Parcel(00000000 0000000N …)`의 마지막 값 `N`이 현재 모드. 0 무음, 1 진동, 2 소리

#### 기능 번호

- `service call`의 숫자는 시스템 서비스 메서드의 Binder 트랜잭션 번호
- 측정 기기(Galaxy S20+, Android 13) 기준: 34 `setRingerModeExternal`(변경), 36 `getRingerModeExternal`(읽기)
- 번호는 AIDL 선언 순서로 정해져 OS 버전마다 다름. 예: Android 12 기준 번호(읽기 34, 변경 32)를 이 기기에 쓰면 읽기로 부른 34가 변경 메서드를 실행
- 번호가 틀리면 다른 메서드가 실행되므로, 기기나 OS를 바꾸면 아래 절차로 번호를 먼저 확인

#### 기능 번호 확인

```sh
adb pull /system/framework/framework.jar
unzip framework.jar 'classes*.dex'
for f in classes*.dex; do
  "$ANDROID_HOME"/build-tools/<버전>/dexdump -l plain "$f" \
    | LC_ALL=C grep -a -A4 -E "name +: 'TRANSACTION_(get|set)RingerModeExternal'" \
    | LC_ALL=C grep -a -E 'name|value'
done
```

- `TRANSACTION_setRingerModeExternal`의 `value`가 변경 번호, `TRANSACTION_getRingerModeExternal`의 `value`가 읽기 번호
- `LC_ALL=C`: `dexdump` 출력에 섞인 비 UTF-8 바이트로 `grep`이 멈추지 않도록 바이트 단위로 검색

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
  - 진동 세기·재생 여부의 근거에서 제외. 재생 여부는 「결과 확인」 표의 진동 기준으로 확인
- 상태 표시줄의 벨소리 아이콘
  - 진동 모드 아이콘과 무음 모드 아이콘의 형태가 유사해 육안 구분 불가
  - 벨소리 모드는 `dumpsys audio`의 `mode (external)`로 확인
- `settings get global mode_ringer`
  - `settings put`으로 변경 시 설정값만 바뀌고 실제 벨소리 모드는 변경되지 않음
  - 벨소리 모드는 `dumpsys audio`의 `mode (external)`로 확인

### adb로 확인 불가

adb로 판정할 수 없어 수동 확인하는 항목.

- 보안 잠금 해제
  - PIN·패턴 입력은 adb로 수행 불가
  - 보안 잠금 화면은 `screencap` 캡처 시 검은 화면이라 근거로 사용 불가
- 진동 촉감과 세기
  - `dumpsys vibrator_manager`에는 진동 요청 기록만 남고 실제 촉감·세기는 기록되지 않음
  - 기기를 든 사람이 확인
