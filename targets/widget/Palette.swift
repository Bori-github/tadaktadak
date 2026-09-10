import SwiftUI

// 원본: src/shared/constants/colors.ts
enum Palette {
    static let canvas = Color(hex: 0x141021)

    static func text(_ mode: TimerActivityMode) -> Color {
        mode == .focus ? Color(hex: 0xF4EAD6) : Color(hex: 0x8FDBE4)
    }

    static func arc(_ mode: TimerActivityMode) -> Color {
        mode == .focus ? Color(hex: 0x6A5B9C) : Color(hex: 0x3F9AA6)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}
