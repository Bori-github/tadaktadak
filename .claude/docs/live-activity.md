# Live Activity 참고

앱 상태에 따라 Live Activity가 어디까지 동작하는지 조사한 사실과 근거를 작성한다.

## 동작 원리

- 앱이 끝날 시각을 전달하면 카운트다운은 iOS가 그린다 (`Text(timerInterval:)`, `ProgressView(timerInterval:)`)
- 그 외 표시 내용(텍스트, 색, 아이콘)은 앱이 전달한 값 그대로 남는다
- Live Activity의 수명은 앱 프로세스와 분리돼 있다. 앱을 종료하거나 시스템이 종료해도 남는다
- 최대 8시간 뒤 시스템이 끝낸다. 끝난 뒤에도 잠금화면에는 최대 4시간 더 남을 수 있다

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
- Flow, [Live Activity, Dynamic Island, and App Blocking](https://www.flow.app/blog/devblog-live-activity-dynamic-island-and-app-blocking)
- Corca, [Live Activity 더 깊게 사용해보기: 실시간 일정 기능 개발기](https://medium.com/corca/live-activity-%EB%8D%94-%EA%B9%8A%EA%B2%8C-%EC%82%AC%EC%9A%A9%ED%95%B4%EB%B3%B4%EA%B8%B0-%EC%8B%A4%EC%8B%9C%EA%B0%84-%EC%9D%BC%EC%A0%95-%EA%B8%B0%EB%8A%A5-%EA%B0%9C%EB%B0%9C%EA%B8%B0-eb10c12bb4ce)
