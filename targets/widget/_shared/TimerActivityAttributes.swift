import ActivityKit
import Foundation

enum TimerActivityMode: String, Codable, Hashable {
    case focus
    case rest
}

struct TimerActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var mode: TimerActivityMode
        var startedAt: Date
        var endsAt: Date
    }
}
