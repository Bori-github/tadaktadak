import ExpoModulesCore
import UIKit

public class WindowControlsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WindowControls")

    // 창 제어 버튼이 safeAreaInsets에 포함되지 않아 cornerAdaptation으로 조회
    AsyncFunction("getLeftInsetAsync") { () -> Double in
      guard let view = UIApplication.shared.connectedScenes
        .compactMap({ ($0 as? UIWindowScene)?.keyWindow })
        .first?.rootViewController?.view
      else { return 0 }

      if #available(iOS 26.0, *) {
        return Double(view.edgeInsets(for: .safeArea(cornerAdaptation: .horizontal)).left)
      }
      return Double(view.safeAreaInsets.left)
    }
    .runOnQueue(.main)
  }
}
