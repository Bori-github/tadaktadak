import XCTest

/// `TC ID`, 결과(통과/불일치), 근거를 탭 문자(`\t`)로 구분해 한 줄 출력. `run.sh`가 `REPORT` 접두어로 수집
private func report(_ id: String, _ ok: Bool, _ evidence: String) {
    print("REPORT\t\(id)\t\(ok ? "통과" : "불일치")\t\(evidence)")
}

private let SHORTCUT_LABEL = "타닥타닥 시작"
private let SHORTCUT_LABEL_EN = "Start Tadak Tadak"
private let APP_NAME = "타닥타닥"
private let FOCUS_DONE_TEXT = "집중 끝!"
// 집중 타이머 1분 전제에 완료 처리 여유 5초
private let FOCUS_DONE_SECONDS: UInt32 = 65

final class ShortcutUITests: XCTestCase {
    private let app = XCUIApplication(bundleIdentifier: "com.boriguri.tadaktadak")
    private let shortcuts = XCUIApplication(bundleIdentifier: "com.apple.shortcuts")
    private let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    private let spotlight = XCUIApplication(bundleIdentifier: "com.apple.Spotlight")

    override func setUp() {
        continueAfterFailure = true
    }

    private func element(_ id: String) -> XCUIElement {
        app.descendants(matching: .any)[id].firstMatch
    }

    private func springboardText(_ text: String) -> XCUIElement {
        springboard.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
    }

    /// 앱을 실행하고 타이머가 진행/일시정지 상태이면 정지
    private func launchIdle() {
        app.launch()
        _ = element("controls-play").waitForExistence(timeout: 60)
        // 권한을 선택하지 않은 상태면 첫 실행마다 알림 권한 요청 창 표시
        let allow = springboard.alerts.buttons["허용"]
        if allow.waitForExistence(timeout: 5) { allow.tap() }
        // 스플래시가 재생 버튼을 덮는 동안의 터치는 무시됨
        let splash = element("splash")
        for _ in 0..<40 where splash.exists { usleep(500_000) }
        let stop = element("controls-stop")
        if stop.isEnabled {
            stop.tap()
            sleep(1)
        }
    }

    /// 단축어 앱의 단축어 타일. 「모든 단축어」 화면에서 앱별 단축어 영역이 아래쪽이라 보일 때까지 스크롤
    private func shortcutTile(_ label: String = SHORTCUT_LABEL) -> XCUIElement {
        shortcuts.activate()
        let tile = shortcuts.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", label)).firstMatch
        _ = tile.waitForExistence(timeout: 5)
        for _ in 0..<8 where !tile.exists || !tile.isHittable {
            shortcuts.swipeUp()
            sleep(1)
        }
        return tile
    }

    /// 알림 센터를 열어 `target` 표시 여부 확인 후 닫기
    /// 드래그 후 알림 센터가 열리지 않는 경우가 있어 최대 3회 시도
    private func inNotificationCenter(_ target: XCUIElement) -> Bool {
        for _ in 0..<3 {
            springboard.coordinate(withNormalizedOffset: CGVector(dx: 0.3, dy: 0))
                .press(forDuration: 0.01, thenDragTo: springboard.coordinate(withNormalizedOffset: CGVector(dx: 0.3, dy: 0.7)), withVelocity: .fast, thenHoldForDuration: 0)
            sleep(2)
            let found = target.exists
            XCUIDevice.shared.press(.home)
            sleep(1)
            if found { return true }
        }
        return false
    }

    func test1ShortcutDisplay() {
        XCUIDevice.shared.press(.home)
        sleep(1)
        let inShortcuts = shortcutTile().exists
        XCUIDevice.shared.press(.home)
        sleep(1)
        // 홈 화면을 빠르게 쓸어내려 Spotlight 표시. 누른 뒤 천천히 끌면 위젯/아이콘 조작으로 처리됨
        // 검색 화면은 `com.apple.Spotlight` 프로세스
        // 앱 보관함 페이지에서 쓸어내리면 앱 보관함 검색이 열려, 홈 화면에서 한 번 더 눌러 첫 페이지로 이동
        XCUIDevice.shared.press(.home)
        sleep(1)
        springboard.swipeDown()
        _ = spotlight.textFields["SpotlightSearchField"].waitForExistence(timeout: 5)
        // 앱 이름만 검색하면 단축어가 「더 보기」 안에 있어 단축어 이름 전체로 검색
        spotlight.typeText(SHORTCUT_LABEL)
        // 웹 검색 제안 셀도 라벨이 단축어 이름과 같아 단축어 결과 셀 식별자로 구분
        let shortcutCell = NSPredicate(format: "identifier BEGINSWITH 'Identifier:AppViewResultCell' AND label CONTAINS %@", SHORTCUT_LABEL)
        let inSpotlight = spotlight.cells.matching(shortcutCell).firstMatch.waitForExistence(timeout: 5)
        XCUIDevice.shared.press(.home)
        // 기기 언어 대신 단축어 앱의 실행 인자로 영어 지정
        shortcuts.terminate()
        shortcuts.launchArguments = ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        shortcuts.launch()
        let inEnglish = shortcutTile(SHORTCUT_LABEL_EN).exists
        // 다음 테스트가 한국어로 열도록 종료 후 실행 인자 제거
        shortcuts.terminate()
        shortcuts.launchArguments = []
        report("TC-TIMER-018", inShortcuts && inSpotlight && inEnglish, "단축어 앱 한국어 \(inShortcuts ? "표시" : "없음"), Spotlight \(inSpotlight ? "표시" : "없음"), 단축어 앱 영어 \(inEnglish ? "표시" : "없음")")
    }

    func test2StartFromBackground() {
        launchIdle()
        // 권한이 승인되지 않으면 알림 설정 버튼 표시. 백그라운드 완료 알림이 오지 않아 판정 불가
        if element("notification-settings").exists {
            print("REPORT\tTC-TIMER-020\t전제 미충족\t알림 권한 없음")
            return
        }
        XCUIDevice.shared.press(.home)
        sleep(1)
        shortcutTile().tap()
        let started = Date()
        // 단축어 실행 후 앱 전환과 스플래시를 지나 진행 상태가 될 때까지 대기
        let stop = element("controls-stop")
        for _ in 0..<20 where !stop.isEnabled { usleep(500_000) }
        let running = stop.isEnabled
        // 완료 시점에 앱이 포그라운드면 알림 대신 진동만 재생되어 홈 화면으로 이동
        XCUIDevice.shared.press(.home)
        sleep(1)
        // Live Activity의 앱 이름은 `StaticText`, 홈 화면 앱 아이콘은 `Icon`이라 종류로 구분
        let liveActivity = inNotificationCenter(springboard.staticTexts[APP_NAME])
        let remaining = FOCUS_DONE_SECONDS - min(FOCUS_DONE_SECONDS, UInt32(Date().timeIntervalSince(started)))
        sleep(remaining)
        let completion = inNotificationCenter(springboardText(FOCUS_DONE_TEXT))
        report("TC-TIMER-020", running && liveActivity && completion, "실행 후 정지 버튼 \(running ? "활성" : "비활성"), 알림 센터 타이머 \(liveActivity ? "표시" : "없음"), 완료 알림 \(completion ? "표시" : "없음")")
    }
}
