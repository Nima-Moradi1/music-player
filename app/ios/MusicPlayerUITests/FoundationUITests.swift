import XCTest

final class FoundationUITests: XCTestCase {
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

    app.buttons["Settings"].tap()
    XCTAssertTrue(app.staticTexts["Appearance"].waitForExistence(timeout: 10))
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

    app.buttons["Settings"].tap()
    XCTAssertTrue(app.staticTexts["Appearance"].waitForExistence(timeout: 10))
  }
}
