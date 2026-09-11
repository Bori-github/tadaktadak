import ActivityKit
import AppIntents
import UserNotifications

/// 잠금화면 정지 버튼
@available(iOS 17.0, *)
struct StopTimerIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "타이머 정지"

    func perform() async throws -> some IntentResult {
        // `LiveActivityIntent`는 위젯이 아니라 앱 프로세스에서 실행되므로 App Group 없이 `UserDefaults.standard`로 앱과 공유
        UserDefaults.standard.set(true, forKey: TimerStoppedFlag.key)

        // 알림은 예약할 때 받은 식별자로 그 알림만 제거하거나, 앱이 예약한 알림을 전부 제거할 수 있음
        // 앱에서 예약하는 알림이 하나이므로 `removeAllPendingNotificationRequests()`를 통해 식별자 구분없이 전부 제거
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()

        for activity in Activity<TimerActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }

        return .result()
    }
}
