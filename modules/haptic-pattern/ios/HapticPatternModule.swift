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
  private var engine: CHHapticEngine?
  private var player: CHHapticPatternPlayer?

  public func definition() -> ModuleDefinition {
    Name("HapticPattern")

    Function("isSupported") { () -> Bool in
      CHHapticEngine.capabilitiesForHardware().supportsHaptics
    }

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
      self?.engine?.stop()
    }
  }

  private func play(_ events: [HapticEventRecord]) throws {
    let engine = try runningEngine()
    let pattern = try CHHapticPattern(events: events.map { hapticEvent(from: $0) }, parameters: [])
    let player = try engine.makePlayer(with: pattern)

    self.player = player
    try player.start(atTime: CHHapticTimeImmediate)
  }

  /// UIApplication 활성 알림을 구독하지 않고, 재생 직전에 엔진을 되살림
  private func runningEngine() throws -> CHHapticEngine {
    if let engine {
      try engine.start()
      return engine
    }

    let created = try CHHapticEngine()

    // 오디오 세션 중단과 백그라운드 진입으로 멈춤. 다음 재생이 새 엔진을 만들게 함
    created.stoppedHandler = { [weak self] _ in self?.engine = nil }

    // 햅틱 서버가 죽어 리셋되면 플레이어를 해제해야 함. `CHHapticEngine.h` resetHandler
    created.resetHandler = { [weak self] in
      self?.player = nil
      try? self?.engine?.start()
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
