# 백그라운드에서 단축어 실행 시 집중 타이머가 시작되지 않음

## 문제

Android에서 타이머 대기 상태의 앱을 백그라운드로 전환한 뒤 앱 아이콘 메뉴의 「타닥타닥 시작」을 터치하면, 앱은 포그라운드로 전환되지만 타이머 대기 상태가 유지되는 경우가 있다. 실시간 업데이트 알림도 표시되지 않는다.

- 측정 기기: Galaxy S20+(SM-G986N), Android 13, One UI 런처, 1.3.0 개발 빌드
- 릴리스 빌드에서는 확인하지 않음

| 조건                                            | 시도 | 실패 |
| ----------------------------------------------- | ---- | ---- |
| 새 프로세스로 실행한 앱을 백그라운드로 전환     | 20   | 3    |
| 장시간 실행된 프로세스의 앱을 백그라운드로 전환 | 3    | 3    |
| 앱 프로세스 종료 후 실행                        | 2    | 0    |

- 실패한 시도에서도 단축어 Intent(`flg=0x1000c000`, extras 포함)가 앱에 전달됨
- 장시간 실행된 프로세스에서 모두 실패한 이유는 확인하지 않음

## 원인

단축어 Intent의 `FLAG_ACTIVITY_CLEAR_TASK`로 기존 Activity가 종료되고 새 Activity가 생성되며, JS 런타임은 유지된 채 `TimerScreen`이 새로 마운트된다. 기존 `TimerScreen`은 새 Activity 시작 후 0.08~0.15초 동안 마운트 상태를 유지한다.

`LiveActivityModule.kt`는 새 Activity의 `OnActivityEntersForeground`에서 시작 요청을 메모리 필드 하나(`isStartRequested`)에 저장하고 `onStartRequested` 이벤트를 전송한다. 기존 `TimerScreen`이 해제되기 전에 이 이벤트가 처리되면, 기존 화면의 `useTimerSession` 리스너가 `settled`가 `true`인 상태라 `consumeStartRequested()`로 요청을 읽고 `isStartRequested`를 `false`로 초기화한다. 기존 화면은 직후 해제되어 그 화면에서 시작한 세션이 저장되지 않는다.

새 `TimerScreen`은 저장값을 읽은 뒤 `consumeStartRequested()`를 호출하지만 이미 `false`라 타이머 대기 상태를 유지한다. 기존 화면 해제와 이벤트 처리의 순서가 시도마다 달라 간헐적으로 발생한다.

- 영향 케이스: TC-TIMER-023, TC-TIMER-025~029
- 타이머 진행/일시정지 상태에서 실행하면 기존 화면이 거절을 처리해 토스트가 표시되지 않을 수 있음. 같은 경로이며 직접 재현하지 않음

logcat 원문: `[DEBUG-161]` 줄은 측정용으로 임시로 추가한 JS 로그이고, 4자리 문자열은 `TimerScreen` 인스턴스 식별자

실패한 시도:

```text
14:47:35.927 START u0 (단축어 Intent 전달)
14:47:36.047 [DEBUG-161] event r2ep settled=true phase=ready
14:47:36.047 [DEBUG-161] consume r2ep requested=true phase=ready
14:47:36.072 [DEBUG-161] unmount r2ep
14:47:36.251 [DEBUG-161] mount f0qq
14:47:36.268 [DEBUG-161] loaded f0qq
14:47:36.269 [DEBUG-161] consume f0qq requested=false phase=ready
```

성공한 시도:

```text
14:46:48.000 START u0 (단축어 Intent 전달)
14:46:48.081 [DEBUG-161] unmount u20v
14:46:48.277 [DEBUG-161] mount cutp
14:46:48.294 [DEBUG-161] loaded cutp
14:46:48.295 [DEBUG-161] consume cutp requested=true phase=ready
```

## 해결

`LiveActivityModule.kt`의 `OnActivityEntersForeground`에서 시작 요청을 처리하지 않아 `onStartRequested` 이벤트가 전송되지 않는다. 재생성된 Activity에서는 새 `TimerScreen`이 저장값을 읽은 뒤 `consumeStartRequested()`로 요청을 확인한다. `OnNewIntent`는 기존 Activity를 재사용해 화면이 하나뿐이므로 이벤트를 유지한다.

수정 후 같은 기기와 개발 빌드에서 확인한 결과는 아래와 같다.

| 조건                                        | 시도 | 결과                                                    |
| ------------------------------------------- | ---- | ------------------------------------------------------- |
| 타이머 대기 상태에서 백그라운드로 전환      | 20   | 20회 모두 진행. 이전 화면의 이벤트 수신 0회             |
| 집중 타이머 진행 상태에서 백그라운드로 전환 | 2    | 새 화면이 `phase=running`에서 요청 수신, 끝날 시각 유지 |
| 앱 프로세스 종료 후 실행                    | 1    | 진행                                                    |

## 재현 방법

1. 앱을 실행해 타이머 대기 상태 확인
2. 홈 버튼으로 앱을 백그라운드로 전환
3. 앱 서랍에서 앱 아이콘을 길게 터치하고 「타닥타닥 시작」 터치
4. 실시간 업데이트 알림 개수 확인: `adb shell dumpsys notification --noredact | grep -c "pkg=com.boriguri.tadaktadak .*channel=live-activity"`
