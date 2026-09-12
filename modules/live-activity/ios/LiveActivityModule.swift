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
  private var stoppedObserver: NSObjectProtocol?
  // 이미 보낸 정지 값. 무관한 `UserDefaults` 변경이나 같은 값에 다시 보내지 않기 위함
  private var emittedStoppedEndsAt: Int?

  public func definition() -> ModuleDefinition {
    Name("LiveActivity")

    Events("onStopped")

    // `StopTimerIntent`가 앱 프로세스에서 값을 쓰는 순간 JavaScript에 이벤트를 보냄
    // 앱이 열릴 때 `AppState` active가 이 저장보다 먼저 오면 전환 처리가 값을 읽지 못함
    OnStartObserving {
      self.emittedStoppedEndsAt = nil
      // `didChangeNotification`은 `UserDefaults.standard`의 모든 변경에 오므로, 정지 값이 새로 써진 때만 골라 보냄
      self.stoppedObserver = NotificationCenter.default.addObserver(
        forName: UserDefaults.didChangeNotification,
        object: UserDefaults.standard,
        queue: .main
      ) { [weak self] _ in
        guard let self else { return }

        // 값이 없으면 읽고 지워진 것. 다음 저장을 새 이벤트로 보게 초기화
        guard let endsAt = UserDefaults.standard.object(forKey: TimerStoppedFlag.key) as? Int else {
          self.emittedStoppedEndsAt = nil
          return
        }

        guard endsAt != self.emittedStoppedEndsAt else { return }

        self.emittedStoppedEndsAt = endsAt
        self.sendEvent("onStopped", ["endsAt": endsAt])
      }
    }

    OnStopObserving {
      if let observer = self.stoppedObserver {
        NotificationCenter.default.removeObserver(observer)
      }

      self.stoppedObserver = nil
    }

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

      // 같은 값으로 다시 요청하면 잠금화면이 깜빡임
      if let activity = Activity<TimerActivityAttributes>.activities.first,
         activity.attributes.mode == content.activityMode, activity.content.state == state {
        return
      }

      // 종료된 Activity는 `update`가 불가하므로 값이 바뀌면 `end` 뒤 `request`
      await TimerActivityAttributes.endAllActivities()

      // 휴식 타이머 시작은 앱이 다시 열리는 활성화 직후라 `request`가 거부될 수 있어 재시도로 감쌈
      guard let activity = try await requestWithForegroundRetry(mode: content.activityMode, state: state) else { return }

      // `.after(끝날 시각)` 종료 정책으로 마지막 타이머가 끝날 때 iOS가 잠금화면에서 제거. 앱 프로세스가 없어도 iOS가 처리
      // 종료된 Live Activity는 Dynamic Island에서 바로 사라짐
      await activity.end(ActivityContent(state: state, staleDate: nil), dismissalPolicy: .after(state.endsAt))
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

  // 집중 타이머 완료로 앱이 다시 열리며 휴식 타이머를 시작할 때, 포그라운드 전환 직후엔 `request`가 `visibility`로 거부됨
  // 곧 포그라운드가 되므로 200밀리초 간격으로 최대 25회(약 5초) 재시도. 그래도 안 되면 `nil`
  @available(iOS 18.0, *)
  private func requestWithForegroundRetry(mode: TimerActivityMode, state: TimerActivityAttributes.ContentState) async throws
    -> Activity<TimerActivityAttributes>?
  {
    let content = ActivityContent(state: state, staleDate: nil)

    for attempt in 0..<25 {
      do {
        return try Activity.request(attributes: TimerActivityAttributes(mode: mode), content: content, pushType: nil)
      } catch ActivityAuthorizationError.visibility {
        if attempt == 24 { return nil }
        // 취소되면 `CancellationError`를 던져 루프를 멈춤. `try?`는 이걸 삼켜 딜레이 없이 25회를 연달아 요청함
        try await Task.sleep(nanoseconds: 200_000_000)
      }
    }

    return nil
  }
}
