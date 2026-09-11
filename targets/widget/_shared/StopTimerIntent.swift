import ActivityKit
import AppIntents
import UserNotifications

/// 잠금화면 정지 버튼
@available(iOS 17.0, *)
struct StopTimerIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "타이머 정지"
    // App Intent는 기본으로 단축어 앱과 Siri에 등록됨
    // 타이머 실행 중 단축어 앱, Siri를 통해 실행되면 예약된 알림이 삭제될 수 있음. 앱은 이 동작을 인지하지 못함
    // 단축어 앱, Siri를 통해 실행되는 것을 방지하기 위해 `isDiscoverable`을 `false`로 설정하여 잠금화면의 정지 버튼으로만 동작하도록 처리
    static let isDiscoverable = false

    func perform() async throws -> some IntentResult {
        // `LiveActivityIntent`는 위젯이 아니라 앱 프로세스에서 실행되므로 App Group 없이 `UserDefaults.standard`로 앱과 공유
        if let state = Activity<TimerActivityAttributes>.activities.first?.content.state {
            UserDefaults.standard.set(state.endsAtInMilliseconds, forKey: TimerStoppedFlag.key)
        }

        // 알림은 예약할 때 받은 식별자로 그 알림만 제거하거나, 앱이 예약한 알림을 전부 제거할 수 있음
        // 앱에서 예약하는 알림이 하나이므로 `removeAllPendingNotificationRequests()`를 통해 식별자 구분없이 전부 제거
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()

        await TimerActivityAttributes.endAllActivities()

        return .result()
    }
}
