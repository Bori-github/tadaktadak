import ActivityKit
import SwiftUI
import WidgetKit

struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            LockScreenView(state: context.state)
                .activityBackgroundTint(Palette.canvas)
                .activitySystemActionForegroundColor(Palette.text(context.state.mode))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.center) {
                    RemainingTimeText(state: context.state)
                        .font(.system(size: 28, weight: .medium))
                }
            } compactLeading: {
                EmptyView()
            } compactTrailing: {
                RemainingTimeText(state: context.state)
            } minimal: {
                RemainingTimeText(state: context.state)
            }
        }
    }
}

private struct RemainingTimeText: View {
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        Text(timerInterval: state.startedAt...state.endsAt, countsDown: true)
            .monospacedDigit()
            .foregroundStyle(Palette.text(state.mode))
    }
}

private struct LockScreenView: View {
    let state: TimerActivityAttributes.ContentState

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            RemainingTimeText(state: state)
                .font(.system(size: 34, weight: .medium))

            ProgressView(timerInterval: state.startedAt...state.endsAt, countsDown: false) {
                EmptyView()
            } currentValueLabel: {
                EmptyView()
            }
            .progressViewStyle(.linear)
            .tint(Palette.arc(state.mode))
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension TimerActivityAttributes.ContentState {
    fileprivate static var focus: Self {
        .init(mode: .focus, startedAt: .now, endsAt: .now.addingTimeInterval(25 * 60))
    }

    fileprivate static var rest: Self {
        .init(mode: .rest, startedAt: .now, endsAt: .now.addingTimeInterval(5 * 60))
    }
}

#Preview("잠금화면", as: .content, using: TimerActivityAttributes()) {
    TimerLiveActivity()
} contentStates: {
    TimerActivityAttributes.ContentState.focus
    TimerActivityAttributes.ContentState.rest
}
