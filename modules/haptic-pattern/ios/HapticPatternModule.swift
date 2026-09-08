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
  // `resetHandler`가 Core Haptics의 큐에서 불려, 아래 두 값을 만지는 자리를 이 큐 하나로 모음
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
    // 지정하지 않으면 Expo가 모든 모듈이 함께 쓰는 직렬 큐에서 돌려, 엔진 시작이 다른 모듈의 비동기 호출을 막음
    .runOnQueue(engineQueue)

    OnDestroy { [weak self] in
      // 재생이 큐를 잡고 `start()`에 들어가 있을 수 있어, 기다리면 부르는 스레드가 멈춤
      self?.engineQueue.async { self?.engine?.stop() }
    }
  }

  /// `engineQueue` 안에서만 호출
  private func play(_ events: [HapticEventRecord]) throws {
    let engine = try runningEngine()
    let pattern = try CHHapticPattern(events: events.map { hapticEvent(from: $0) }, parameters: [])

    let player = try engine.makePlayer(with: pattern)

    // 재생이 끝날 때까지 붙들지 않으면 패턴 도중에 해제됨
    self.player = player
    try player.start(atTime: CHHapticTimeImmediate)
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

    // 엔진이 만들어지고 시작까지 되면서도 울릴 하드웨어가 없는 기기가 있어, 먼저 확인해 대체 진동으로 보냄
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { throw CHHapticError(.notSupported) }

    let created = try CHHapticEngine()

    // 놀고 있는 동안 하드웨어를 끔. 타이머 한 번에 한 번 울려 그 사이가 대부분
    created.isAutoShutdownEnabled = true

    // 햅틱 서버가 죽어 리셋되면 플레이어를 해제해야 함. `CHHapticEngine.h` resetHandler
    // 다시 시작은 하지 않음. 재생 직전마다 `start()`를 부르므로 여기서 켜면 자동 종료가 무의미해짐
    created.resetHandler = { [weak self] in
      self?.engineQueue.async { self?.player = nil }
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
