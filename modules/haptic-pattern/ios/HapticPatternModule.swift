import AudioToolbox
import CoreHaptics
import ExpoModulesCore

enum HapticEventType: String, Enumerable {
  case transient
  case continuous
}

struct HapticEventRecord: Record {
  @Field var type: HapticEventType = .transient
  @Field var timeMs: Double = 0
  @Field var durationMs: Double = 0
  @Field var intensity: Double = 1
  @Field var sharpness: Double = 0.5
}

public class HapticPatternModule: Module {
  // 재생은 Expo의 백그라운드 큐에서, `resetHandler`는 Core Haptics의 큐에서 불려 아래 두 값이 겹침
  private let engineQueue = DispatchQueue(label: "com.boriguri.tadaktadak.haptic-pattern")
  private var engine: CHHapticEngine?
  private var player: CHHapticPatternPlayer?

  public func definition() -> ModuleDefinition {
    Name("HapticPattern")

    AsyncFunction("playAsync") { [weak self] (events: [HapticEventRecord]) in
      guard let self else { return }

      do {
        try self.play(events)
      } catch {
        // 재생에 실패하면 시스템 진동으로 대체. 햅틱 하드웨어가 없는 기기는 엔진 생성에서 `CHHapticError.Code.notSupported`로 실패
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
      }
    }

    OnDestroy { [weak self] in
      self?.engineQueue.sync { self?.engine?.stop() }
    }
  }

  private func play(_ events: [HapticEventRecord]) throws {
    try engineQueue.sync {
      let engine = try runningEngine()
      let pattern = try CHHapticPattern(events: events.map { hapticEvent(from: $0) }, parameters: [])
      let player = try engine.makePlayer(with: pattern)

      self.player = player
      try player.start(atTime: CHHapticTimeImmediate)
    }
  }

  /// `engineQueue` 안에서만 호출. UIApplication 활성 알림을 구독하지 않고, 재생 직전에 엔진을 되살림
  private func runningEngine() throws -> CHHapticEngine {
    if let engine {
      do {
        try engine.start()
        return engine
      } catch {
        // 되살아나지 못한 엔진을 붙들고 있으면 이후 재생이 모두 같은 실패를 반복함
        self.engine = nil
        self.player = nil
        throw error
      }
    }

    let created = try CHHapticEngine()

    // 놀고 있는 동안 하드웨어를 끔. 타이머 한 번에 한 번 울려 그 사이가 대부분
    created.isAutoShutdownEnabled = true

    // 햅틱 서버가 죽어 리셋되면 플레이어를 해제해야 함. `CHHapticEngine.h` resetHandler
    created.resetHandler = { [weak self] in
      self?.engineQueue.async {
        self?.player = nil
        try? self?.engine?.start()
      }
    }

    try created.start()
    engine = created

    return created
  }

  private func hapticEvent(from event: HapticEventRecord) -> CHHapticEvent {
    let parameters = [
      CHHapticEventParameter(parameterID: .hapticIntensity, value: Float(event.intensity)),
      CHHapticEventParameter(parameterID: .hapticSharpness, value: Float(event.sharpness)),
    ]
    let relativeTime = event.timeMs / 1000

    switch event.type {
    case .transient:
      return CHHapticEvent(eventType: .hapticTransient, parameters: parameters, relativeTime: relativeTime)
    case .continuous:
      return CHHapticEvent(eventType: .hapticContinuous, parameters: parameters, relativeTime: relativeTime, duration: event.durationMs / 1000)
    }
  }
}
