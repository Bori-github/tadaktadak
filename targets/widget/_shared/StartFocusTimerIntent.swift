import AppIntents

/// Siri/단축어 앱/Spotlight의 「타닥타닥 시작」
struct StartFocusTimerIntent: AppIntent {
    static let title: LocalizedStringResource = "집중 타이머 시작"
    static let openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        return .result()
    }
}
