import ActivityKit
import SwiftUI
import WidgetKit

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            LockScreenView(mode: context.attributes.mode, state: context.state)
                .activityBackgroundTint(Palette.canvas)
                .activitySystemActionForegroundColor(Palette.text(context.attributes.mode))
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
    let mode: TimerActivityMode
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        Text(timerInterval: state.progressStartsAt...state.endsAt, countsDown: true)
            .monospacedDigit()
            .foregroundStyle(Palette.text(mode))
    }
}

/// Live Activity · 잠금화면 프레임 배치
private struct LockScreenView: View {
    let mode: TimerActivityMode
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("타닥타닥")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Palette.appName)

            HStack(spacing: 20) {
                Button(intent: StopTimerIntent()) {
                    Image("button-round-enabled")
                        .overlay { Image("icon-stop") }
                }
                .buttonStyle(.plain)

                RemainingTimeText(mode: mode, state: state)
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
                .tint(Palette.arc(mode))

                Image(mode == .focus ? "bonfire-hot-still-9" : "bonfire-cold-9")
            }
            .padding(.top, 12)
        }
        .padding(EdgeInsets(top: 13, leading: 16, bottom: 14, trailing: 16))
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .topTrailing) {
            Button(intent: DismissLiveActivityIntent()) {
                CloseMark()
            }
            .buttonStyle(.plain)
            .padding(.top, 7)
            .padding(.trailing, 8)
        }
    }
}

/// 잠금화면 닫기 버튼
private struct CloseMark: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(Palette.closeCircle)

            ForEach([45.0, -45.0], id: \.self) { degrees in
                RoundedRectangle(cornerRadius: 0.75)
                    .fill(Palette.closeMark)
                    .frame(width: 10, height: 1.5)
                    .rotationEffect(.degrees(degrees))
            }
        }
        .frame(width: 28, height: 28)
    }
}

extension TimerActivityAttributes.ContentState {
    fileprivate static func running(minutes: Double) -> Self {
        .init(progressStartsAt: .now, endsAt: .now.addingTimeInterval(minutes * 60))
    }
}

#Preview("집중", as: .content, using: TimerActivityAttributes(mode: .focus)) {
    TimerLiveActivity()
} contentStates: {
    TimerActivityAttributes.ContentState.running(minutes: 25)
}

#Preview("휴식", as: .content, using: TimerActivityAttributes(mode: .rest)) {
    TimerLiveActivity()
} contentStates: {
    TimerActivityAttributes.ContentState.running(minutes: 5)
}
