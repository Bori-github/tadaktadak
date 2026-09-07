import CoreHaptics
import ExpoModulesCore

public class HapticPatternModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HapticPattern")

    Function("isSupported") { () -> Bool in
      CHHapticEngine.capabilitiesForHardware().supportsHaptics
    }
  }
}
