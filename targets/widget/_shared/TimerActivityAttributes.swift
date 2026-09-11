import ActivityKit
import Foundation

enum TimerActivityMode: String, Codable, Hashable {
    case focus
    case rest
}

struct TimerActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        // (endsAt - 타이머 시간) = progressStartsAt
        var progressStartsAt: Date
        var endsAt: Date
    }

    let mode: TimerActivityMode
}

/// 정지 버튼이 `UserDefaults.standard`에 남기는 정지됨 플래그. 앱이 실행·복귀할 때 읽고 지움
enum TimerStoppedFlag {
    static let key = "liveActivityStopped"
}
