import ActivityKit
import Foundation

// `modules/live-activity/ios/`에 심볼릭 링크로 들어가 Pod에서도 컴파일됨
// 앱 타겟과 Pod가 함께 쓰는 값은 이 파일에 위치

enum TimerActivityMode: String, Codable, Hashable {
    case focus
    case rest
}

struct TimerActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        /// (endsAt - 타이머 시간) = progressStartsAt
        var progressStartsAt: Date
        var endsAt: Date

        /// JavaScript의 `session.endsAt`과 같은 단위
        /// 반올림하지 않으면 `Date` 변환에서 1밀리초가 어긋남
        var endsAtInMilliseconds: Int {
            Int((endsAt.timeIntervalSince1970 * 1000).rounded())
        }
    }

    let mode: TimerActivityMode

    /// 선택한 언어 태그. `nil`이면 위젯이 시스템 언어를 따름
    let language: String?

    static func endAllActivities() async {
        for activity in Activity<TimerActivityAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }
}

/// `StopTimerIntent`가 저장하는 값. 정지한 Live Activity의 `endsAt`(밀리초)
enum TimerStoppedFlag {
    static let key = "liveActivityStoppedEndsAt"
}
