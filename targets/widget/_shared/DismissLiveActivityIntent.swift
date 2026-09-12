import ActivityKit
import AppIntents

/// 잠금화면 닫기 버튼
@available(iOS 17.0, *)
struct DismissLiveActivityIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "Live Activity 닫기"
    static let isDiscoverable = false

    func perform() async throws -> some IntentResult {
        await TimerActivityAttributes.endAllActivities()

        return .result()
    }
}
