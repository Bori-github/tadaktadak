import SwiftUI

struct Palette {
    let canvas: Color
    let appName: Color
    let text: Color
    let arc: Color
    let closeCircle: Color
    let closeMark: Color

    init(_ colors: TimerActivityColors) {
        canvas = Color(hex: colors.canvas)
        appName = Color(hex: colors.appName)
        text = Color(hex: colors.text)
        arc = Color(hex: colors.arc)
        closeCircle = Color(hex: colors.close).opacity(0.12)
        closeMark = Color(hex: colors.close).opacity(0.8)
    }
}

extension Color {
    /// `#` 뒤 6자리 16진수만 파싱. 알파 포함 8자리 미지원
    /// 파싱 실패 시 검정
    init(hex: String) {
        let value = UInt32(hex.dropFirst(), radix: 16) ?? 0
        self.init(
            .sRGB,
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255,
            opacity: 1
        )
    }
}
