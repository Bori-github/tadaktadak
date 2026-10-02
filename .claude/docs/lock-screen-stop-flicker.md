# 잠금화면에서 타이머 정지 시 화면 깜빡임

## 문제

Android 잠금화면의 타이머 진행 중 알림에서 「정지」를 누르면 앱이 열리면서, 잠금 시점의 남은 시간이 보인 후 대기 화면으로 바뀐다.

- 측정 기기: Galaxy S20+(SM-G986N), Android 13(API 33), 개발 빌드
- iOS Live Activity의 정지에서는 문제가 발생하지 않음

## 원인

Android가 백그라운드로 가는 작업의 화면을 캡처해 저장했다가(task snapshot), 그 작업이 다시 보일 때 앱이 첫 프레임을 렌더링한 뒤 제거 애니메이션이 끝날 때까지 시작 창(`SnapshotStartingWindow`)으로 표시한다. 잠금 시점에 캡처된 화면이라 이전 남은 시간이 보인다.

정지 직후 logcat 순서는 아래와 같다. 시각은 `adb logcat -v time`이 기록한 기기 시각이고, 정지 탭은 15:38:03.249다.

| 기기 시각(15:38 기준 초) | 탭 후(초) | 로그                                          |
| ------------------------ | --------- | --------------------------------------------- |
| 03.417                   | 0.168     | `SnapshotStartingWindow` 표시                 |
| 03.437                   | 0.188     | JS `onStopped` 수신                           |
| 03.446                   | 0.197     | `first real window is shown`                  |
| 03.640                   | 0.391     | `SnapshotStartingWindow` 제거 애니메이션 시작 |
| 03.711                   | 0.462     | `SnapshotStartingWindow` 화면에서 제거        |
| 03.726                   | 0.477     | 세션 `ready` 반영                             |

- 잠금 상태 전환 15:37:45.6, 그때 남은 시간 50초. 정지 직후 보인 00:50과 같음
- 잠금 상태에서 JS는 남은 시간을 33, 32로 갱신. 00:50은 앱이 렌더링한 화면이 아니라 스냅샷
- 스냅샷 제거 직후 진행 화면(00:32)이 1프레임 보임. `onStopped`(03.437)에서 `ready` 반영(03.726)까지 0.29초 소요

logcat 원문: `[STOPDBG]` 줄은 측정용으로 임시로 넣은 JS 로그

```text
10-02 15:37:45.631 I/ReactNativeJS(16815): '[STOPDBG] appState', 1790923065629, 'background'
10-02 15:38:02.102 I/ReactNativeJS(16815): '[STOPDBG] commit', 1790923082097, 'phase', 'running', 'seconds', 33
10-02 15:38:03.107 I/ReactNativeJS(16815): '[STOPDBG] commit', 1790923083102, 'phase', 'running', 'seconds', 32
10-02 15:38:03.417 D/SurfaceFlinger( 1381):      DEVICE | 0xb40000724a648b50 | 0000 | RGBA_8888    |  180.0  400.0  900.0 2000.0 |    0    0 1080 2400 | SnapshotStartingWindow for taskId=234$_6069#3937
10-02 15:38:03.437 I/ReactNativeJS(16815): '[STOPDBG] onStopped', 1790923083436
10-02 15:38:03.439 I/ReactNativeJS(16815): '[STOPDBG] restore', 1790923083438, 'consumed', 1790923114960, 'phase', 'running'
10-02 15:38:03.443 I/ReactNativeJS(16815): '[STOPDBG] appState', 1790923083442, 'active'
10-02 15:38:03.445 I/ReactNativeJS(16815): '[STOPDBG] restore', 1790923083444, 'consumed', null, 'phase', 'running'
10-02 15:38:03.446 V/WindowManager( 1457): Finish starting ActivityRecord{8fbbb7 u0 com.boriguri.tadaktadak/.MainActivity} t234}: first real window is shown, no animation
10-02 15:38:03.448 I/ReactNativeJS(16815): '[STOPDBG] appState', 1790923083447, 'background'
10-02 15:38:03.602 I/ReactNativeJS(16815): '[STOPDBG] appState', 1790923083601, 'active'
10-02 15:38:03.602 I/ReactNativeJS(16815): '[STOPDBG] restore', 1790923083602, 'consumed', null, 'phase', 'running'
10-02 15:38:03.640 D/WindowManager( 1457): Starting window removed Window{67a7145 u0 SnapshotStartingWindow for taskId=234}
10-02 15:38:03.711 I/SurfaceFlinger( 1381): id=3937 Removed SnapshotStartingWindow for taskId=234$_6069#3937 (125)
10-02 15:38:03.726 I/ReactNativeJS(16815): '[STOPDBG] commit', 1790923083725, 'phase', 'ready', 'seconds', null
```

## 시도한 방법

| 방법                                                                                    | 결과                                                 | 근거                                                                                                                                    |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 정지 `PendingIntent`의 action을 런처 Intent와 다른 값으로 변경                          | 이전 값이 그대로 보임                                | `SnapshotStartingWindow`가 정지 Intent `START`보다 36ms 먼저 추가된다                                                                   |
| `setRecentsScreenshotEnabled(false)`                                                    | 흰 화면이 0.235초 보임                               | 스냅샷 대신 작업 배경색 단색으로 채운다. 배경색을 지정하지 않으면 라이트 모드에서 `#FAFAFA`로 채워진다                                  |
| 위 방법 + `setTaskDescription` 배경색 `#141021`                                         | 이전 값·흰 화면 없음                                 | 단색이 앱 배경과 같은 색이다                                                                                                            |
| 위 방법을 화면이 꺼질 때(`onPause`에서 `PowerManager.isInteractive()`가 `false`)만 적용 | 홈으로 이동한 뒤 잠금 상태로 전환하면 이전 값이 보임 | 홈으로 이동할 때 진행 화면이 캡처되고, 그 뒤 잠금 상태가 되어도 백그라운드 상태라 `onPause`가 다시 호출되지 않아 스냅샷이 바뀌지 않는다 |

## 해결

`modules/live-activity`의 `LiveActivityModule.kt`에서 `startAsync`가 `setRecentsScreenshotEnabled(false)`, `endAsync`가 `setRecentsScreenshotEnabled(true)`를 호출한다. 두 함수 모두 `setTaskDescription`으로 작업 배경색을 `canvas`(`#141021`)로 지정한다.

- 스냅샷 설정은 캡처 시점의 값으로 적용. 정지 뒤 대기 상태에서 홈으로 이동하면 최근 앱 미리보기에 화면이 보임
- 진행 중에는 최근 앱 미리보기도 단색. 최근 앱 미리보기와 시작 창이 같은 스냅샷을 써서 분리 불가
- 단색의 알파는 항상 255. AOSP Android 13 `TaskSnapshotController`, Android 14~16과 `main`의 `AbsAppSnapshotController`가 `setAlphaComponent(..., 255)`로 덮어씀
- API 33 미만은 `setRecentsScreenshotEnabled`가 없어 적용되지 않음

## 측정 결과

정지 탭 뒤 시계판 영역(세로 550~1550px)을 프레임별로 분석했다. 흰 화면·단색 구간은 영역 평균 밝기 YAVG(0 검정 ~ 255 흰색, 대기 화면 37)로, 이전 숫자는 프레임 이미지로 판별했다.

| 항목                      | 수정 전          | 스크린샷만 끔         | 배경색까지 지정 |
| ------------------------- | ---------------- | --------------------- | --------------- |
| 이전 숫자가 보인 시간     | 0.28초(18프레임) | 0초                   | 0초             |
| 흰 화면                   | 없음             | 0.235초(밝기 224~231) | 없음            |
| 앱 영역 단색 구간 밝기    | —                | —                     | 32~38           |
| 대기 화면이 안정될 때까지 | 0.38초           | 0.27초                | 0.37초          |

- 알림창이 사라지는 회색 전환(밝기 약 190)은 수정 전·스크린샷만 끔·배경색까지 지정에서 모두 발생. 시스템 UI 애니메이션
- 배경색까지 지정해도 대기 화면이 나타나는 첫 2프레임은 조작 버튼이 일시정지 아이콘. 숫자는 처음부터 01:00

## 측정 방법

잠금 자격 증명이 없는 기기에서 adb로 모두 조작한다. 탭 좌표는 기기와 알림 개수에 따라 달라 `uiautomator dump`로 찾는다.

1. 조작 중 화면이 꺼지지 않게 처리(완료 후 `false`로 되돌림)

   ```sh
   adb shell svc power stayon true
   ```

2. 앱에서 재생한 뒤 녹화를 시작하고 잠금 상태로 전환

   ```sh
   adb shell screenrecord --time-limit 25 /sdcard/lock.mp4 &
   adb shell "input keyevent 26; sleep 4; input keyevent 224"
   ```

3. 잠금화면의 타이머 알림 아이콘을 눌러 알림을 펼치고, 「정지」를 누름

4. 녹화를 가져와 프레임별 시각, 밝기, 이미지를 추출: `screenrecord`는 가변 프레임이라 `passthrough`로 추출. 이전 숫자가 보인 프레임은 밝기로 구분되지 않아 이미지로 판별

   ```sh
   adb pull /sdcard/lock.mp4
   mkdir -p frames
   ffmpeg -i lock.mp4 -fps_mode passthrough -vf "crop=1080:1000:0:550,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=luma.txt" -f null -
   ffmpeg -i lock.mp4 -fps_mode passthrough -vf scale=216:-1 frames/%03d.png
   ```

5. 시작 창 종류와 순서는 logcat에서 확인

   ```sh
   adb logcat -d -v time | grep -E "SnapshotStartingWindow|first real window|START u0.*tadaktadak"
   ```

- JS 쪽 순서는 `src/screens/timer/model/session.ts`의 `onStopped`·`AppState` 리스너와 `restoreRunningSession`에 `console.log('[STOPDBG]', Date.now(), ...)`를 임시로 넣어 logcat `ReactNativeJS`로 수집
