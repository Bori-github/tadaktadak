import ActivityKit
import ExpoModulesCore

struct LiveActivityContentRecord: Record {
  @Field var mode: String = "focus"
  @Field var progressStartsAt: Double = 0
  @Field var endsAt: Double = 0

  var activityMode: TimerActivityMode {
    TimerActivityMode(rawValue: mode) ?? .focus
  }

  var state: TimerActivityAttributes.ContentState {
    .init(
      progressStartsAt: Date(timeIntervalSince1970: progressStartsAt / 1000),
      endsAt: Date(timeIntervalSince1970: endsAt / 1000)
    )
  }
}

public class LiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiveActivity")

    Property("isSupported") {
      if #available(iOS 18.0, *) { return true }
      return false
    }

    Property("isEnabled") {
      ActivityAuthorizationInfo().areActivitiesEnabled
    }

    AsyncFunction("startAsync") { (content: LiveActivityContentRecord) in
      guard #available(iOS 18.0, *) else { return }
      // 스위치를 호출 시점에 읽음. TypeScript가 미리 읽어 두면 그 뒤 꺼진 것을 모름
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

      let state = content.state

      if let activity = Activity<TimerActivityAttributes>.activities.first {
        // 타이머 모드를 갱신으로 바꾸지 못해 기존 Live Activity를 끝내고 새로 시작
        if activity.attributes.mode != content.activityMode {
          await activity.end(nil, dismissalPolicy: .immediate)
        } else {
          // 같은 값으로 다시 요청하면 잠금화면이 깜빡임
          guard activity.content.state != state else { return }

          await activity.update(ActivityContent(state: state, staleDate: state.endsAt))
          return
        }
      }

      _ = try Activity.request(
        attributes: TimerActivityAttributes(mode: content.activityMode),
        content: ActivityContent(state: state, staleDate: state.endsAt),
        pushType: nil
      )
    }

    AsyncFunction("endAsync") {
      guard #available(iOS 18.0, *) else { return }

      await TimerActivityAttributes.endAllActivities()
    }

    Function("consumeStoppedEndsAt") { () -> Int? in
      let defaults = UserDefaults.standard
      let endsAt = defaults.object(forKey: TimerStoppedFlag.key) as? Int

      defaults.removeObject(forKey: TimerStoppedFlag.key)

      return endsAt
    }
  }
}
