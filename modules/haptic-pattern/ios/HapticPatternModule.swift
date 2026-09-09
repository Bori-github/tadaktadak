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
  // `resetHandler`가 Core Haptics의 큐에서 불려, 엔진과 플레이어를 읽고 쓰는 자리를 이 큐 하나로 모음
  private let engineQueue = DispatchQueue(label: "com.boriguri.tadaktadak.haptic-pattern")
  private var engine: CHHapticEngine?
  private var player: CHHapticPatternPlayer?
  // 반복 재생할 패턴. 리셋에도 남으므로 플레이어만 다시 만듦. `CHHapticEngine.h` resetHandler
  private var preparedPatterns: [String: CHHapticPattern] = [:]
  private var preparedPlayers: [String: CHHapticPatternPlayer] = [:]

  public func definition() -> ModuleDefinition {
    Name("HapticPattern")

    // 진동이 울리지 못하는 기기에서 완료를 다른 수단으로 알리게 하려고 밖으로 냄
    Property("supportsHaptics") {
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
    // 지정하지 않으면 Expo가 모든 모듈이 함께 쓰는 직렬 큐에서 실행해, 엔진 시작이 다른 모듈의 비동기 호출을 막음
    .runOnQueue(engineQueue)

    AsyncFunction("prepareAsync") { [weak self] (name: String, events: [HapticEventRecord]) in
      guard let self else { return }

      let pattern = try CHHapticPattern(events: events.map { self.hapticEvent(from: $0) }, parameters: [])

      self.preparedPatterns[name] = pattern
      // 엔진을 만들지 못하는 기기에서도 준비를 실패로 두지 않음. 재생 자리에서 실패를 알리지 않고 넘어감
      self.preparedPlayers[name] = try? self.runningEngine().makePlayer(with: pattern)
    }
    .runOnQueue(engineQueue)

    // 스냅마다 부르는 자리라 Promise를 만들지 않음. 부른 스레드를 멈추지 않게 큐로 넘기고 바로 돌아옴
    Function("play") { [weak self] (name: String) in
      self?.engineQueue.async { self?.playPrepared(name) }
    }

    AsyncFunction("holdAsync") { [weak self] in
      guard let self else { return }

      let engine = try self.runningEngine()

      // 유휴에 하드웨어가 꺼지면 다음 재생의 시작이 늦어짐. `CHHapticEngine.h` autoShutdownEnabled
      engine.isAutoShutdownEnabled = false
    }
    .runOnQueue(engineQueue)

    Function("release") { [weak self] in
      self?.engineQueue.async { self?.engine?.isAutoShutdownEnabled = true }
    }

    OnDestroy { [weak self] in
      // 재생이 큐를 점유한 채 `start()`에 머무를 수 있어, 기다리면 부르는 스레드가 멈춤
      self?.engineQueue.async { self?.engine?.stop() }
    }
  }

  /// `engineQueue` 안에서만 호출
  private func play(_ events: [HapticEventRecord]) throws {
    let engine = try runningEngine()
    let pattern = try CHHapticPattern(events: events.map { hapticEvent(from: $0) }, parameters: [])

    let player = try engine.makePlayer(with: pattern)

    // 재생이 끝날 때까지 참조를 유지하지 않으면 패턴 도중에 해제됨
    self.player = player
    try player.start(atTime: CHHapticTimeImmediate)
  }

  /// `engineQueue` 안에서만 호출
  private func playPrepared(_ name: String) {
    guard let pattern = preparedPatterns[name] else { return }

    do {
      // 앱이 백그라운드에 들어가면 엔진이 멈추므로(`CHHapticEngine.h` ApplicationSuspended) 재생 직전마다 다시 시작함
      let engine = try runningEngine()
      let player = try preparedPlayers[name] ?? engine.makePlayer(with: pattern)

      preparedPlayers[name] = player
      try player.start(atTime: CHHapticTimeImmediate)
    } catch {
      // 스냅과 누름은 실패해도 알람 세기의 시스템 진동으로 대체하지 않고 넘어감
      // 멈춘 엔진에서 만든 플레이어가 남았을 수 있어, 버려서 다음 재생이 다시 만들게 함
      preparedPlayers[name] = nil
    }
  }

  /// `engineQueue` 안에서만 호출. UIApplication 활성 알림을 구독하지 않고, 재생 직전에 엔진을 다시 시작함
  private func runningEngine() throws -> CHHapticEngine {
    if let engine {
      do {
        try engine.start()
        return engine
      } catch {
        // 다시 시작하지 못한 엔진을 유지하면 이후 재생이 모두 같은 실패를 반복함
        self.engine = nil
        self.player = nil
        throw error
      }
    }

    // 엔진 생성과 시작까지 성공해도 울릴 하드웨어가 없는 기기가 있어, 먼저 확인해 대체 진동으로 보냄
    guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { throw CHHapticError(.notSupported) }

    let created = try CHHapticEngine()

    // 유휴 동안 하드웨어를 끔. 타이머 한 번에 한 번 울려 그 사이가 대부분
    created.isAutoShutdownEnabled = true

    // 햅틱 서버가 중단돼 리셋되면 플레이어를 해제해야 함. `CHHapticEngine.h` resetHandler
    // 다시 시작은 하지 않음. 재생 직전마다 `start()`를 부르므로 여기서 켜면 자동 종료가 무의미해짐
    created.resetHandler = { [weak self] in
      self?.engineQueue.async {
        self?.player = nil
        self?.preparedPlayers.removeAll()
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
