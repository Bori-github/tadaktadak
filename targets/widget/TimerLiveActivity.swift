import ActivityKit
import SwiftUI
import WidgetKit

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            let palette = Palette(context.attributes.colors ?? .campfire(context.attributes.mode))

            LockScreenView(
                mode: context.attributes.mode,
                theme: context.attributes.theme ?? .campfire,
                palette: palette,
                state: context.state
            )
                .environment(\.locale, context.attributes.language.map(Locale.init(identifier:)) ?? .current)
                .activityBackgroundTint(palette.canvas)
                .activitySystemActionForegroundColor(palette.text)
        } dynamicIsland: { _ in
            // 시작 직후 `end`로 종료 상태가 되어 Dynamic Island에 표시되지 않음. `ActivityConfiguration`이 `dynamicIsland`를 요구해 빈 뷰로 채움
            DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    EmptyView()
                }
            } compactLeading: {
                EmptyView()
            } compactTrailing: {
                EmptyView()
            } minimal: {
                EmptyView()
            }
        }
        // Live Activity 자체 여백 제거
        .contentMarginsDisabled()
    }
}

private struct RemainingTimeText: View {
    let palette: Palette
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        Text(timerInterval: state.progressStartsAt...state.endsAt, countsDown: true)
            .monospacedDigit()
            .foregroundStyle(palette.text)
    }
}

/// Live Activity · 잠금화면 프레임 배치
private struct LockScreenView: View {
    let mode: TimerActivityMode
    let theme: TimerActivityTheme
    let palette: Palette
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Tadak Tadak")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(palette.appName)

            HStack(spacing: 20) {
                Button(intent: StopTimerIntent()) {
                    Image(theme.stopButton)
                        .overlay { Image("icon-stop") }
                }
                .buttonStyle(.plain)

                RemainingTimeText(palette: palette, state: state)
                    .font(.system(size: 34, weight: .medium))
            }
            .padding(.top, 11)

            HStack(spacing: 12) {
                ProgressView(timerInterval: state.progressStartsAt...state.endsAt, countsDown: false) {
                    EmptyView()
                } currentValueLabel: {
                    EmptyView()
                }
                .progressViewStyle(.linear)
                .tint(palette.arc)

                Image(theme.picture(mode))
            }
            .padding(.top, 12)
        }
        .padding(EdgeInsets(top: 13, leading: 16, bottom: 14, trailing: 16))
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .topTrailing) {
            Button(intent: DismissLiveActivityIntent()) {
                CloseMark(palette: palette)
            }
            .buttonStyle(.plain)
            .padding(.top, 7)
            .padding(.trailing, 8)
        }
    }
}

/// 잠금화면 닫기 버튼
private struct CloseMark: View {
    let palette: Palette

    var body: some View {
        ZStack {
            Circle()
                .fill(palette.closeCircle)

            ForEach([45.0, -45.0], id: \.self) { degrees in
                RoundedRectangle(cornerRadius: 0.75)
                    .fill(palette.closeMark)
                    .frame(width: 10, height: 1.5)
                    .rotationEffect(.degrees(degrees))
            }
        }
        .frame(width: 28, height: 28)
    }
}

extension TimerActivityTheme {
    fileprivate var stopButton: String {
        switch self {
        case .campfire: "button-round-enabled"
        case .winter: "button-round-enabled-winter"
        }
    }

    fileprivate func picture(_ mode: TimerActivityMode) -> String {
        switch self {
        case .campfire: mode == .focus ? "bonfire-hot-still-9" : "bonfire-cold-9"
        case .winter: mode == .focus ? "bulb-big-on" : "bulb-big-off"
        }
    }
}

extension TimerActivityAttributes.ContentState {
    fileprivate static func running(minutes: Double) -> Self {
        .init(progressStartsAt: .now, endsAt: .now.addingTimeInterval(minutes * 60))
    }
}

// `colors` 없는 Activity와 Xcode 미리보기용. `src/shared/constants/defaultPalette.ts`의 `DEFAULT_PALETTE` 값 복제
extension TimerActivityColors {
    fileprivate static func campfire(_ mode: TimerActivityMode) -> Self {
        mode == .focus
            ? Self(canvas: "#141021", appName: "#7a6ea8", text: "#f4ead6", arc: "#6a5b9c", close: "#f4ead6")
            : Self(canvas: "#141021", appName: "#7a6ea8", text: "#8fdbe4", arc: "#3f9aa6", close: "#f4ead6")
    }
}

#Preview("집중", as: .content, using: TimerActivityAttributes(mode: .focus, theme: .campfire, colors: .campfire(.focus), language: nil)) {
    TimerLiveActivity()
} contentStates: {
    TimerActivityAttributes.ContentState.running(minutes: 25)
}

#Preview("휴식", as: .content, using: TimerActivityAttributes(mode: .rest, theme: .campfire, colors: .campfire(.rest), language: nil)) {
    TimerLiveActivity()
} contentStates: {
    TimerActivityAttributes.ContentState.running(minutes: 5)
}
