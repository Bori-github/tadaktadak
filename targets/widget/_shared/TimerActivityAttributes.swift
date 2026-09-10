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
