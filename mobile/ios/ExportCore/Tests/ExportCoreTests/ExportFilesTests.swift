// ============================================================================
// Source: mobile/ios/ExportCore/Tests/ExportCoreTests/ExportFilesTests.swift
// Version: 0.1.0 — 2026-11-20
// Why: Holds the iPhone FileExport's pure half to the same cases as Android's
//      ExportFilesTest.kt, one test for one test: the names the page sends are
//      accepted as is, anything that is not a plain basename is refused, only
//      the .ics/.png/.jpg triples pass, base64 is decoded strictly, sizes are
//      capped on the decoded bytes, image bytes must carry their signature, the
//      caption is truncated at 2,000 units, the file always lands directly in
//      <tmp>/exports/, and clear() deletes only regular files in that folder.
// Env / Deps: XCTest; a temp folder stands in for NSTemporaryDirectory().
//      `swift test` in mobile/ios/ExportCore.
// ============================================================================

import Foundation
import XCTest
@testable import ExportCore

final class ExportFilesTests: XCTestCase {
    private let pngBytes: [UInt8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3]
    private let jpegBytes: [UInt8] = [0xFF, 0xD8, 0xFF, 0xE0, 9]

    private func b64(_ bytes: [UInt8]) -> String { Data(bytes).base64EncodedString() }
    private func padded(_ bytes: [UInt8], to count: Int) -> [UInt8] { bytes + [UInt8](repeating: 0, count: count - bytes.count) }

    private func ok(_ r: ExportFiles.Result, file: StaticString = #filePath, line: UInt = #line) -> ExportFiles.Accepted {
        guard case let .ok(accepted) = r else {
            XCTFail("rejected: \(r)", file: file, line: line)
            return ExportFiles.Accepted(kind: .ics, name: "", bytes: Data(), text: nil)
        }
        return accepted
    }

    private func code(_ r: ExportFiles.Result) -> String {
        if case let .rejected(code, _) = r { return code }
        return "OK"
    }

    private func check(_ name: String?, _ mime: String?, _ content: String?, _ base64: String?, _ text: String? = nil) -> ExportFiles.Result {
        ExportFiles.check(fileName: name, mimeType: mime, content: content, base64: base64, text: text)
    }

    private func tempDir(_ label: String) throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(label)-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    func testAcceptsTheNamesThePageSends() {
        for n in ["taghvim-dates.ics", "taghvim-1405-08-30.png", "taghvim-1405-08-30.jpg", "a_b.2.ics"] {
            XCTAssertEqual(ExportFiles.safeFileName(n), n)
        }
    }

    func testRefusesAnythingButAPlainBasename() {
        let bad: [String?] = [
            nil, "", ".ics", "../taghvim-dates.ics", "x/../../y.ics", "/data/x.ics", "a/b.ics",
            "a\\b.ics", ".hidden.ics", "a..ics", "a.ics\u{0}", "-a.ics", "تاریخ.ics", "my dates.ics",
            "noext", "a.PNG", String(repeating: "x", count: ExportFiles.maxName) + ".ics",
            "a.ics\n", // ICU's `$` would let this through a regex
        ]
        for name in bad { XCTAssertNil(ExportFiles.safeFileName(name), "accepted: \(String(describing: name))") }
    }

    func testTheThreeAllowedTriplesPass() {
        let ics = ok(check("taghvim-dates.ics", "text/calendar;charset=utf-8", "BEGIN:VCALENDAR", nil))
        XCTAssertEqual(ics.kind, .ics)
        XCTAssertEqual(ics.bytes, Data("BEGIN:VCALENDAR".utf8))
        let png = ok(check("taghvim-1405-08-30.png", "image/png", nil, b64(pngBytes), "متن"))
        XCTAssertEqual(png.kind, .png)
        XCTAssertEqual(png.bytes, Data(pngBytes))
        XCTAssertEqual(png.text, "متن")
        let jpg = ok(check("taghvim-1405-08-30.jpg", "image/jpeg", nil, b64(jpegBytes)))
        XCTAssertEqual(jpg.kind, .jpeg)
        XCTAssertNil(jpg.text)
    }

    func testAnythingOutsideTheAllowlistIsBadType() {
        let png = b64(pngBytes)
        let jpg = b64(jpegBytes)
        XCTAssertEqual(code(check("a.ics", "text/plain", "x", nil)), "BAD_TYPE")
        XCTAssertEqual(code(check("a.ics", nil, "x", nil)), "BAD_TYPE")
        XCTAssertEqual(code(check("a.gif", "image/gif", nil, png)), "BAD_TYPE")
        XCTAssertEqual(code(check("a.svg", "image/svg+xml", "<svg/>", nil)), "BAD_TYPE")
        XCTAssertEqual(code(check("a.bin", "application/octet-stream", nil, png)), "BAD_TYPE")
        // Extension must match the type; .jpeg is not the spelling the page uses.
        XCTAssertEqual(code(check("a.jpeg", "image/jpeg", nil, jpg)), "BAD_TYPE")
        XCTAssertEqual(code(check("a.png", "image/jpeg", nil, jpg)), "BAD_TYPE")
        XCTAssertEqual(code(check("a.ics", "image/png", nil, png)), "BAD_TYPE")
        XCTAssertEqual(code(check("a.png", "text/calendar", "x", nil)), "BAD_TYPE")
        // Payload kind must match the type.
        XCTAssertEqual(code(check("a.png", "image/png", "text", nil)), "BAD_TYPE")
        XCTAssertEqual(code(check("a.ics", "text/calendar", nil, b64(Array("x".utf8)))), "BAD_TYPE")
        XCTAssertEqual(code(check("../a.png", "image/png", nil, png)), "BAD_NAME")
    }

    func testExactlyOnePayload() {
        let png = b64(pngBytes)
        XCTAssertEqual(code(check("a.png", "image/png", nil, nil)), "BAD_CONTENT")
        XCTAssertEqual(code(check("a.png", "image/png", "x", png)), "BAD_CONTENT")
        XCTAssertEqual(code(check("a.ics", "text/calendar", nil, nil)), "BAD_CONTENT")
        XCTAssertEqual(code(check("a.ics", "text/calendar", "x", "eA==")), "BAD_CONTENT")
    }

    func testMalformedBase64IsBadContent() {
        let good = b64(pngBytes) // "iVBORw0KGgoBAgM="
        XCTAssertEqual(good, "iVBORw0KGgoBAgM=")
        let bad = [
            "", "data:image/png;base64,\(good)", "\(good)\n", " \(good)", String(good.dropLast()), "\(good)=",
            good.replacingOccurrences(of: "B", with: "-"), good.replacingOccurrences(of: "B", with: "_"),
            "====", "A===", "iVBO=w==",
            "iVBORw0KGgo۱", // a Persian digit is not in the alphabet
        ]
        for s in bad { XCTAssertEqual(code(check("a.png", "image/png", nil, s)), "BAD_CONTENT", "decoded: \(s)") }
    }

    func testDecoderMatchesFoundationOnEveryPadding() {
        var generator = SystemRandomNumberGenerator()
        for n in 1...40 {
            let bytes = (0..<n).map { _ in UInt8.random(in: 0...255, using: &generator) }
            XCTAssertEqual(ExportFiles.decodeBase64(b64(bytes)), Data(bytes), "n=\(n)")
        }
        XCTAssertNil(ExportFiles.decodeBase64(""))
        // Spare bits must be zero, so each byte string has one spelling.
        XCTAssertEqual(ExportFiles.decodeBase64("AA=="), Data([0]))
        XCTAssertNil(ExportFiles.decodeBase64("AF=="))
        XCTAssertNil(ExportFiles.decodeBase64("AAB="))
    }

    func testImageBytesMustCarryTheirSignature() {
        XCTAssertEqual(code(check("a.png", "image/png", nil, b64(jpegBytes))), "BAD_CONTENT")
        XCTAssertEqual(code(check("a.jpg", "image/jpeg", nil, b64(pngBytes))), "BAD_CONTENT")
        XCTAssertEqual(code(check("a.png", "image/png", nil, b64(Array(pngBytes.prefix(7))))), "BAD_CONTENT")
        XCTAssertEqual(code(check("a.png", "image/png", nil, b64(Array("<html>".utf8)))), "BAD_CONTENT")
    }

    func testSizeIsCappedOnDecodedBytesPerKind() {
        XCTAssertEqual(code(check("a.png", "image/png", nil, b64(padded(pngBytes, to: ExportFiles.maxImageBytes)))), "OK")
        XCTAssertEqual(code(check("a.png", "image/png", nil, b64(padded(pngBytes, to: ExportFiles.maxImageBytes + 1)))), "TOO_LARGE")
        // A card well past the largest ever measured (925 KB) passes.
        XCTAssertEqual(code(check("a.jpg", "image/jpeg", nil, b64(padded(jpegBytes, to: 1_500_000)))), "OK")
        // .ics keeps its own 1 MB cap, counted in UTF-8 bytes (Persian letters are two each).
        XCTAssertEqual(code(check("a.ics", "text/calendar", String(repeating: "x", count: ExportFiles.maxTextBytes), nil)), "OK")
        XCTAssertEqual(code(check("a.ics", "text/calendar", String(repeating: "ت", count: ExportFiles.maxTextBytes / 2 + 1), nil)), "TOO_LARGE")
    }

    func testCaptionIsTruncatedNotRejected() {
        XCTAssertNil(ExportFiles.shareText(nil))
        XCTAssertNil(ExportFiles.shareText("  "))
        XCTAssertEqual(ExportFiles.shareText("امروز"), "امروز")
        let long = String(repeating: "ی", count: ExportFiles.maxShareText + 500)
        XCTAssertEqual(ExportFiles.shareText(long)?.utf16.count, ExportFiles.maxShareText)
        // Never cut a surrogate pair in half.
        let pair = String(repeating: "a", count: ExportFiles.maxShareText - 1) + "🌙tail"
        let cut = ExportFiles.shareText(pair)!
        XCTAssertEqual(cut.utf16.count, ExportFiles.maxShareText - 1)
        XCTAssertFalse(UTF16.isLeadSurrogate(cut.utf16.last!))
        XCTAssertEqual(ok(check("a.png", "image/png", nil, b64(pngBytes), long)).text?.utf16.count, ExportFiles.maxShareText)
    }

    func testTheFileLandsDirectlyInTmpExports() throws {
        let base = try tempDir("tmp")
        defer { try? FileManager.default.removeItem(at: base) }
        let file = try ExportFiles.target(base: base, name: "taghvim-dates.ics")
        XCTAssertEqual(file.deletingLastPathComponent().path,
                       base.appendingPathComponent("exports").resolvingSymlinksInPath().standardizedFileURL.path)
        XCTAssertEqual(file.lastPathComponent, "taghvim-dates.ics")
        // The resolved-path check is the second fence behind safeFileName.
        XCTAssertThrowsError(try ExportFiles.target(base: base, name: "../escape.ics"))
        XCTAssertThrowsError(try ExportFiles.target(base: base, name: "sub/x.ics"))
    }

    func testWriteLeavesExactlyOneFileWithTheBytes() throws {
        let base = try tempDir("tmp")
        defer { try? FileManager.default.removeItem(at: base) }
        _ = try ExportFiles.write(base: base, name: "taghvim-1405-08-30.png", bytes: Data(pngBytes))
        let file = try ExportFiles.write(base: base, name: "taghvim-dates.ics", bytes: Data("BEGIN:VCALENDAR".utf8))
        XCTAssertEqual(try Data(contentsOf: file), Data("BEGIN:VCALENDAR".utf8))
        let left = try FileManager.default.contentsOfDirectory(atPath: base.appendingPathComponent("exports").path)
        XCTAssertEqual(left, ["taghvim-dates.ics"])
    }

    func testClearDeletesOnlyRegularFilesDirectlyInExports() throws {
        let fm = FileManager.default
        let base = try tempDir("tmp")
        defer { try? fm.removeItem(at: base) }
        XCTAssertEqual(ExportFiles.clear(base: base), 0) // no exports/ yet
        let exports = base.appendingPathComponent("exports", isDirectory: true)
        try fm.createDirectory(at: exports, withIntermediateDirectories: true)
        try Data("x".utf8).write(to: exports.appendingPathComponent("taghvim-dates.ics"))
        try Data("x".utf8).write(to: exports.appendingPathComponent(".taghvim-dates.ics.tmp"))
        let sub = exports.appendingPathComponent("sub", isDirectory: true)
        try fm.createDirectory(at: sub, withIntermediateDirectories: true)
        let nested = sub.appendingPathComponent("kept.ics")
        try Data("x".utf8).write(to: nested)
        let outside = base.appendingPathComponent("outside.ics")
        try Data("x".utf8).write(to: outside)
        let link = exports.appendingPathComponent("link.ics")
        try fm.createSymbolicLink(at: link, withDestinationURL: outside)

        XCTAssertEqual(ExportFiles.clear(base: base), 2)
        XCTAssertFalse(fm.fileExists(atPath: exports.appendingPathComponent("taghvim-dates.ics").path))
        XCTAssertFalse(fm.fileExists(atPath: exports.appendingPathComponent(".taghvim-dates.ics.tmp").path))
        XCTAssertTrue(fm.fileExists(atPath: nested.path), "subfolder entered")
        XCTAssertTrue(fm.fileExists(atPath: outside.path), "link followed")
        XCTAssertEqual(try fm.destinationOfSymbolicLink(atPath: link.path), outside.path, "link removed")
    }

    func testClearLeavesAnExportsLinkAlone() throws {
        let fm = FileManager.default
        let base = try tempDir("tmp")
        let elsewhere = try tempDir("elsewhere")
        defer {
            try? fm.removeItem(at: base)
            try? fm.removeItem(at: elsewhere)
        }
        let victim = elsewhere.appendingPathComponent("victim.ics")
        try Data("x".utf8).write(to: victim)
        try fm.createSymbolicLink(at: base.appendingPathComponent("exports"), withDestinationURL: elsewhere)
        XCTAssertEqual(ExportFiles.clear(base: base), 0)
        XCTAssertTrue(fm.fileExists(atPath: victim.path))
    }
}
