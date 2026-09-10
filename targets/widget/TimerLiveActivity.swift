import ActivityKit
import SwiftUI
import WidgetKit

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            LockScreenView(mode: context.attributes.mode, state: context.state)
                .activityBackgroundTint(Palette.canvas)
                .activitySystemActionForegroundColor(Palette.text(context.attributes.mode))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    RemainingTimeText(mode: context.attributes.mode, state: context.state)
                        .font(.system(size: 28, weight: .medium))
                }
            } compactLeading: {
                EmptyView()
            } compactTrailing: {
                RemainingTimeText(mode: context.attributes.mode, state: context.state)
            } minimal: {
                RemainingTimeText(mode: context.attributes.mode, state: context.state)
            }
        }
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

private struct LockScreenView: View {
    let mode: TimerActivityMode
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            RemainingTimeText(mode: mode, state: state)
                .font(.system(size: 34, weight: .medium))

            ProgressView(timerInterval: state.progressStartsAt...state.endsAt, countsDown: mode == .focus) {
                EmptyView()
            } currentValueLabel: {
                EmptyView()
            }
            .progressViewStyle(.linear)
            .tint(Palette.arc(mode))
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
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
