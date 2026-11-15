import AppIntents

/// Siri/단축어 앱/Spotlight의 「타닥타닥 시작」
struct StartFocusTimerIntent: AppIntent {
    static let title: LocalizedStringResource = "집중 타이머 시작"
    static let openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        // `openAppWhenRun`으로 앱 프로세스에서 실행되므로 App Group 없이 `UserDefaults.standard`로 앱과 공유
        UserDefaults.standard.set(true, forKey: TimerStartRequestFlag.key)

        return .result()
    }
}
