import XCTest

final class FoundationUITests: XCTestCase {
  private func openSettings(_ app: XCUIApplication) {
    for _ in 0..<3 {
      if app.staticTexts["Appearance"].waitForExistence(timeout: 3) { return }
      if app.buttons["Settings"].exists { app.buttons["Settings"].tap() }
    }
    XCTAssertTrue(app.staticTexts["Appearance"].waitForExistence(timeout: 10))
  }

  func testAccessibleHomeLibraryAndSettings() throws {
    guard #available(iOS 17.0, *) else {
      throw XCTSkip("XCTest accessibility audits require iOS 17 or newer")
    }
    let app = XCUIApplication()
    app.launch()
    let start = app.buttons["Make it yours"]
    if start.waitForExistence(timeout: 15) { start.tap() }

    XCTAssertTrue(app.staticTexts["A little closer to the music you love."].waitForExistence(timeout: 20))
    try app.performAccessibilityAudit(for: [.hitRegion, .sufficientElementDescription, .textClipped])

    let library = app.descendants(matching: .any).matching(identifier: "Library").firstMatch
    library.tap()
    XCTAssertTrue(app.textFields["Search your library"].waitForExistence(timeout: 15))
    try app.performAccessibilityAudit(for: [.hitRegion, .sufficientElementDescription, .textClipped])

    openSettings(app)
    try app.performAccessibilityAudit(for: [.hitRegion, .sufficientElementDescription, .textClipped])
  }

  func testOnboardingLibraryAndSettings() {
    let app = XCUIApplication()
    app.launch()

    let start = app.buttons["Make it yours"]
    if start.waitForExistence(timeout: 15) {
      start.tap()
    }

    XCTAssertTrue(app.staticTexts["A little closer to the music you love."].waitForExistence(timeout: 20))
    let library = app.descendants(matching: .any).matching(identifier: "Library").firstMatch
    XCTAssertTrue(library.waitForExistence(timeout: 10))
    library.tap()
    XCTAssertTrue(app.textFields["Search your library"].waitForExistence(timeout: 15))

    openSettings(app)
  }

  func testPersianSettingsAndSelectionPersist() throws {
    let app = XCUIApplication()
    app.launch()
    let start = app.buttons["Make it yours"]
    if start.waitForExistence(timeout: 15) { start.tap() }

    openSettings(app)
    app.buttons["Dark"].tap()
    XCTAssertTrue(app.buttons["Dark"].isSelected)
    app.buttons["فارسی"].tap()
    XCTAssertTrue(app.staticTexts["ظاهر"].waitForExistence(timeout: 10))
    XCTAssertTrue(app.buttons["فارسی"].isSelected)
    if #available(iOS 17.0, *) {
      try app.performAccessibilityAudit(for: [.hitRegion, .sufficientElementDescription, .textClipped])
    }

    app.terminate()
    app.launch()
    XCTAssertTrue(app.staticTexts["پخش موسیقی"].waitForExistence(timeout: 20))
    if #available(iOS 17.0, *) {
      try app.performAccessibilityAudit(for: [.hitRegion, .sufficientElementDescription, .textClipped])
    }
    let library = app.descendants(matching: .any).matching(identifier: "کتابخانه").firstMatch
    XCTAssertTrue(library.waitForExistence(timeout: 10))
    app.buttons["تنظیمات"].tap()
    XCTAssertTrue(app.buttons["فارسی"].isSelected)
    XCTAssertTrue(app.buttons["تیره"].isSelected)

    app.buttons["English"].tap()
    XCTAssertTrue(app.staticTexts["Appearance"].waitForExistence(timeout: 10))
    app.buttons["Use device theme"].tap()
    XCTAssertTrue(app.buttons["Use device theme"].isSelected)
  }
}
