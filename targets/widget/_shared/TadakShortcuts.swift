import AppIntents

struct TadakShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartFocusTimerIntent(),
            phrases: ["\(.applicationName) 시작"],
            shortTitle: LocalizedStringResource("타닥타닥 시작", table: "ShortcutTitles"),
            systemImageName: "play.fill"
        )
    }
}
