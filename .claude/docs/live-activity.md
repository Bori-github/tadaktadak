# Live Activity 참고

앱 상태에 따라 Live Activity가 어디까지 동작하는지 조사한 사실과 근거를 작성한다.

## 동작 원리

- 앱이 끝날 시각을 전달하면 카운트다운은 iOS가 그린다 (`Text(timerInterval:)`, `ProgressView(timerInterval:)`)
- 그 외 표시 내용(텍스트, 색, 아이콘)은 앱이 전달한 값 그대로 남는다
- Live Activity의 수명은 앱 프로세스와 분리돼 있다. 앱을 종료하거나 시스템이 종료해도 남는다
- 최대 8시간 뒤 시스템이 끝낸다. 끝난 뒤에도 잠금화면에는 최대 4시간 더 남을 수 있다

## 버전별 지원 기능

| 버전     | 기능                                                                 |
| -------- | -------------------------------------------------------------------- |
| iOS 16.1 | 도입. 잠금화면과 Dynamic Island 표시, 앱에서 시작, 푸시 토큰 갱신    |
| iOS 16.2 | `ActivityContent` (`staleDate`, `relevanceScore`), 잦은 갱신 허용 키 |
| iOS 17   | App Intents 버튼과 토글, StandBy 표시, iPad 지원                     |
| iOS 17.2 | push-to-start. 앱을 실행하지 않고 서버에서 시작                      |
| iOS 18   | 채널 브로드캐스트 푸시, Apple Watch 스마트 스택 표시                 |
| iOS 26   | 예약 시작, CarPlay 표시, macOS 26 표시                               |
| iOS 26.5 | 서드파티 액세서리 표시(`AccessoryLiveActivities`). EU 한정           |

## 앱 상태별로 되는 것

| 동작                         | 앱 실행 중 | 앱 잠듦·종료 | 서버 푸시 |
| ---------------------------- | ---------- | ------------ | --------- |
| 시작                         | 가능       | 불가         | 가능      |
| 남은 시간 카운트다운         | 자동       | 자동         | —         |
| 내용 갱신 (모드 전환 등)     | 가능       | 불가         | 가능      |
| 정확한 시각에 자동 종료 예약 | 없음       | 없음         | 가능      |
| 버튼(App Intent) → 앱 코드   | 가능       | 가능         | —         |
| 스와이프 해제 감지           | 가능       | 불가         | —         |
| 재실행 뒤 남은 것 찾아 정리  | 가능       | —            | —         |

- 앱이 잠들거나 죽은 뒤에는 카운트다운만 계속되고, 끝나면 `0:00`에서 멈춘다
- `staleDate`는 그 시각 이후 "오래됨" 표시를 붙일 뿐 사라지게 하지 않는다
- iOS 26의 예약 시작(`Activity.request(start:)`)은 시작만 예약한다. 종료 예약은 없다
- 백그라운드 태스크(`BGTaskScheduler`)는 실행 시각을 iOS가 정하므로 타이머 전환에 쓸 수 없다
- 사용자가 잠금화면에서 스와이프로 해제하는 것은 막을 수 없다. 앱이 잠들어 있으면 해제된 사실도 받지 못한다

## 종료·재실행

- 사용자가 앱을 스와이프로 종료하거나 시스템이 종료할 때 앱은 콜백을 받지 못한다. 잠든(suspended) 앱은 그대로 사라진다
- 예약된 로컬 알림은 앱이 죽어도 시간이 되면 울린다
- 남은 Live Activity를 정리할 수 있는 다음 순간은 앱 재실행 때다. `Activity.activities`로 찾아 이어가거나 끝낸다. Apple도 이 방식을 안내한다

## App Group

- 정지 버튼 App Intent는 앱이 아니라 Widget Extension 프로세스에서 실행된다. 둘은 각자의 샌드박스 컨테이너를 쓴다
- 앱과 Widget Extension은 서로의 `UserDefaults.standard`를 읽지 못한다
- 정지 버튼을 눌러도 앱이 저장한 끝날 시각은 그대로 남는다. 재실행한 앱은 그 값만 보고 타이머가 진행 중이라고 판단한다
- App Group은 앱과 Widget Extension이 함께 여는 컨테이너다. 정지됨 플래그를 여기에 둔다

### 서명 제약

| 항목                  | 무료 Personal Team                                            | Apple Developer Program |
| --------------------- | ------------------------------------------------------------- | ----------------------- |
| Widget Extension 서명 | 가능                                                          | 가능                    |
| Live Activity         | 가능. `Info.plist`의 `NSSupportsLiveActivities` 키만 요구한다 | 가능                    |
| App Group             | **불가능**                                                    | 가능                    |
| 프로파일 유효 기간    | 7일                                                           | 1년                     |

- App Group은 개발자 포털에서 App ID에 등록해야 켜진다. 무료 Personal Team은 포털을 쓸 수 없어 프로파일에 `com.apple.security.application-groups`가 들어가지 않는다
- 서명 단계에서 막힌다. 빌드를 시작하기 전에 결과가 나온다

### App Group 대안

| 방법                                            | 단점                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| 앱이 재실행 때 `Activity.activities`로 추론한다 | 스와이프 해제도 정지로 읽혀 타이머가 취소된다                              |
| App Intent에 `openAppWhenRun = true`를 준다     | 잠금화면에서 정지를 누르면 앱이 열린다. 정리는 앱이 자기 프로세스에서 한다 |

## 사례

| 앱    | 방식                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flow  | 자동 시작 지원을 위해 Firebase 푸시 도입. "not possible to update a Live Activity directly from the app once it's in the background"               |
| Trace | Silent Push로 앱을 깨우는 방식이 불안정해 포기. Firebase Functions가 매 분 상태를 계산해 ActivityKit Push. Push to Start로 앱을 실행하지 않고 시작 |

## 출처

- Apple, [Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)
- Apple, [Starting and updating Live Activities with ActivityKit push notifications](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications)
- Apple, [applicationWillTerminate(_:)](<https://developer.apple.com/documentation/uikit/uiapplicationdelegate/applicationwillterminate(_:)>)
- Apple Developer Forums, [Force quitting the app doesn't end the Live Activities](https://developer.apple.com/forums/thread/729651)
- Apple Developer Forums, [App Groups capability is not available](https://developer.apple.com/forums/thread/656271)
- Flow, [Live Activity, Dynamic Island, and App Blocking](https://www.flow.app/blog/devblog-live-activity-dynamic-island-and-app-blocking)
- Corca, [Live Activity 더 깊게 사용해보기: 실시간 일정 기능 개발기](https://medium.com/corca/live-activity-%EB%8D%94-%EA%B9%8A%EA%B2%8C-%EC%82%AC%EC%9A%A9%ED%95%B4%EB%B3%B4%EA%B8%B0-%EC%8B%A4%EC%8B%9C%EA%B0%84-%EC%9D%BC%EC%A0%95-%EA%B8%B0%EB%8A%A5-%EA%B0%9C%EB%B0%9C%EA%B8%B0-eb10c12bb4ce)

---

## 개발 과정

### 빌드 설정

Live Activity 지원 여부는 앱 설정에서 선언한다. `app.json`의 `ios.infoPlist`에 추가한다.

```json
{
  "ios": {
    "infoPlist": {
      "NSSupportsLiveActivities": true,
      "CADisableMinimumFrameDurationOnPhone": true
    }
  }
}
```

| 키                                     | 의미                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `NSSupportsLiveActivities`             | 앱의 Live Activity 사용 선언. 잠금화면과 Dynamic Island 표시가 이 키로 활성화 |
| `CADisableMinimumFrameDurationOnPhone` | 시스템 기본 주사율 상한 해제. ProMotion 화면에서만 효과                       |
