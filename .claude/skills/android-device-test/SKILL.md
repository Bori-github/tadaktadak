---
name: android-device-test
description: Android 실기기 테스트 스크립트를 순서대로 실행하고 TC별 결과를 보고한다. 약 30분간 기기를 조작하면서 벨소리 모드, 알림 권한, 화면 켜짐 유지, 앱의 진동 토글/언어/타이머 시간을 바꾸므로 `/android-device-test`로만 실행한다. 바꾼 설정은 스크립트가 끝나거나 중단될 때 되돌린다.
disable-model-invocation: true
---

# Android 실기기 테스트 실행

`scripts/device-test/android/`의 스크립트를 실행하고 `TESTS.md` 기준으로 결과를 판정한다.

## 사전 확인

1. `adb devices` 출력에서 상태가 `device`인 기기의 시리얼을 확인한다. 없으면 `TESTS.md` 「연결」을 안내하고 중단한다. 여러 개면 사용자에게 테스트할 기기를 확인받는다. 무선 디버깅에서는 같은 기기가 USB와 mDNS 이름으로 두 번 나올 수 있다.
2. 이후 모든 adb 명령은 `adb -s <시리얼>`로, 모든 스크립트는 `SERIAL=<시리얼>`을 붙여 실행한다.
3. 기기 모델(`getprop ro.product.model`), Android 버전(`getprop ro.build.version.release`), 앱 버전(`dumpsys package com.boriguri.tadaktadak | grep versionName`)을 조회해 결과 보고에 사용한다.
4. 기기가 `TESTS.md`의 측정 기기와 다르면 같은 문서의 「다른 기기 사용」을 안내하고 중단한다.
5. 아래 전제 조건을 확인하고, 하나라도 충족하지 않으면 사용자에게 알린 뒤 중단한다.

   - 알림 권한 허용: 아래 명령 출력이 있음
     ```sh
     adb -s <시리얼> shell dumpsys package com.boriguri.tadaktadak | grep 'POST_NOTIFICATIONS: granted=true'
     ```
   - 집중 타이머 1분, 진동 토글 켜짐, 배경음 꺼짐: 아래 명령 출력이 `1 1 0`
     ```sh
     SERIAL=<시리얼> sh -c '. scripts/device-test/android/lib.sh; start_idle; echo "$(focus_minutes) $(vibration_enabled && echo 1 || echo 0) $(wait_ambient 1 && echo 1 || echo 0)"'
     ```
   - 시스템 언어 한국어: `adb -s <시리얼> shell getprop persist.sys.locale` 출력이 `ko-KR`
   - 휴식 타이머 1분, 보안 잠금(PIN/패턴) 없음: adb로 조회할 수 없어 사용자에게 확인

## 실행 명령

스크립트는 아래 형식으로 실행한다. stderr도 함께 수집하고, 마지막 줄의 `종료 코드`로 정상 종료 여부를 판정한다. `grep`이 셸 함수(ugrep)로 재정의된 환경에서는 `-v` 출력이 줄 단위로 플러시되지 않아 수동 확인 프롬프트가 지연되므로 `command grep`으로 시스템 `grep`을 호출한다.

```sh
{ SERIAL=<시리얼> sh scripts/device-test/android/<스크립트>.sh 2>&1; echo "종료 코드 $?"; } | command grep --line-buffered -v -E '^Warning: Activity not started|^[[:space:]]+at '
```

- 출력 중 `TC-`로 시작하는 줄을 결과로 수집한다
- 종료 코드가 0이 아니면 직전 출력 줄을 실패 원인으로 기록하고, 결과 줄이 출력되지 않은 TC를 미실행으로 처리한 뒤 다음 스크립트를 실행한다

## 수동 확인이 필요한 스크립트

`ringer.sh`는 TC-NOTIFICATION-006의 진동 체감을 사용자 입력으로 판정한다. 자동 실행보다 먼저 「실행 명령」 형식으로 Monitor(`timeout_ms` 1800000)에서 실행해 stdout을 줄 단위로 수신한다.

- `수동 확인:` 줄을 수신하면 질문을 그대로 사용자에게 전달한다
- 사용자 응답(`y`, `n`, Enter는 빈 문자열)은 줄 끝 답변 파일 경로에 `.tmp`를 붙인 파일에 쓴 뒤 `mv`로 교체한다. 스크립트가 쓰기 중인 파일을 읽지 않도록 원자적으로 교체한다

## 자동 실행

수동 확인이 필요한 스크립트가 끝나면 아래 스크립트를 순차 실행한다. 병렬로 실행하면 같은 기기를 동시에 조작해 결과가 오염되므로 이전 스크립트가 종료된 뒤 다음 스크립트를 시작한다.

1. `timer-cycle.sh`
2. `pause-stop.sh`
3. `relaunch.sh`
4. `permission.sh`
5. `haptics.sh`
6. `live-update.sh`
7. `language.sh`
8. `ambient-sound.sh`

스크립트 소요 시간(각 머리 주석 참고)이 Bash 도구 기본 타임아웃 2분을 넘을 수 있으므로 `run_in_background`로 실행하고 완료 알림을 기다린다.

## 예외

다음 목록은 사용자가 요청할 때 실행한다.

- `notification-matrix.sh`

## 결과 보고

첫 줄에 기기 모델, Android 버전, 앱 버전과 통과/불일치/미실행 개수를 적고, 이어서 실행 순서대로 `TC ID | 결과 | 근거` 표를 작성한다. 불일치와 미실행 TC는 표 아래에 따로 모아 원인이 된 출력 줄을 함께 첨부한다.
