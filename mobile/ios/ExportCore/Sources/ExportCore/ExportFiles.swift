// ============================================================================
// Source: mobile/ios/ExportCore/Sources/ExportCore/ExportFiles.swift
// Version: 0.1.0 — 2026-11-20
// Why: The pure half of the iPhone app's FileExportPlugin, a line-for-line
//      twin of Android's ExportFiles.kt so the two apps accept exactly the same
//      requests. The plugin is not a general file writer: it hands out three
//      kinds of file, each a fixed (mime, extension, payload) triple — the .ics
//      of «تاریخ‌های من» as UTF-8 text, and the hero's day card as a PNG or
//      JPEG sent as base64. `check` turns what the page sent into either the
//      bytes to write or one reject code; the plugin only writes and opens the
//      share sheet.
//      Names stay a bare ASCII basename whose extension matches the type,
//      because the receiving app shows the name. Image bytes must start with
//      their format's signature, so the page cannot hand out something else
//      under an image type. Lengths are counted in UTF-16 units, as Kotlin and
//      JavaScript count them, so a limit means the same number on both sides.
//      `clear` empties <tmp>/exports/ before each new export and once per
//      launch, so the last export (people's names, or the day's card) does not
//      linger.
// Env / Deps: Foundation only. Held by Tests/ExportCoreTests (`swift test`).
// ============================================================================

import Foundation

public enum ExportFiles {
    // The one folder under the app's temporary directory that exports use.
    public static let dir = "exports"
    public static let maxName = 64

    // 60 dates × 10 written-out years of .ics is far below 1 MB; anything larger is not ours.
    public static let maxTextBytes = 1_000_000

    // The card is 1080×1080; the largest ever measured was 925 KB (a photo card
    // as PNG). 4 MiB is >4× that and keeps the base64 string under 5.6 MB.
    public static let maxImageBytes = 4 * 1024 * 1024

    // The caption a chat app puts beside the image. A longer one is TRUNCATED
    // rather than rejected — a long caption must never cost the person the picture.
    public static let maxShareText = 2_000

    public enum Payload: Equatable { case text, base64 }

    public enum Kind: CaseIterable, Equatable {
        case ics, png, jpeg

        public var mime: String {
            switch self {
            case .ics: return "text/calendar"
            case .png: return "image/png"
            case .jpeg: return "image/jpeg"
            }
        }

        public var fileExtension: String {
            switch self {
            case .ics: return "ics"
            case .png: return "png"
            case .jpeg: return "jpg"
            }
        }

        public var payload: Payload { self == .ics ? .text : .base64 }
        public var maxBytes: Int { self == .ics ? maxTextBytes : maxImageBytes }

        public var magic: [UInt8]? {
            switch self {
            case .ics: return nil
            case .png: return [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
            case .jpeg: return [0xFF, 0xD8, 0xFF]
            }
        }
    }

    public struct Accepted: Equatable {
        public let kind: Kind
        public let name: String
        public let bytes: Data
        public let text: String?
    }

    public enum Result: Equatable {
        case ok(Accepted)
        case rejected(code: String, message: String)
    }

    public enum PathError: Error { case escapes }

    // The name the file will carry, or nil when it is not a plain ASCII
    // basename: ^[A-Za-z0-9][A-Za-z0-9._-]*\.[a-z]+$ and no "..". Written out
    // rather than as a regex because ICU's `$` also matches before a final
    // newline, which Kotlin's `matches` does not.
    public static func safeFileName(_ raw: String?) -> String? {
        guard let raw = raw, raw.utf16.count <= maxName else { return nil }
        let units = Array(raw.utf16)
        guard let lastDot = units.lastIndex(of: 0x2E), lastDot >= 1, lastDot < units.count - 1 else { return nil }
        let isLower: (UInt16) -> Bool = { $0 >= 0x61 && $0 <= 0x7A }
        let isAlnum: (UInt16) -> Bool = { isLower($0) || ($0 >= 0x41 && $0 <= 0x5A) || ($0 >= 0x30 && $0 <= 0x39) }
        guard isAlnum(units[0]) else { return nil }
        for u in units[1..<lastDot] where !(isAlnum(u) || u == 0x2E || u == 0x5F || u == 0x2D) { return nil }
        for u in units[(lastDot + 1)...] where !isLower(u) { return nil }
        if raw.contains("..") { return nil }
        return raw
    }

    // The kind a mime type names, parameters (";charset=utf-8") ignored.
    public static func kindFor(_ mime: String?) -> Kind? {
        guard let mime = mime else { return nil }
        let bare = (mime.split(separator: ";", maxSplits: 1, omittingEmptySubsequences: false).first.map(String.init) ?? "")
            .trimmingCharacters(in: .whitespaces)
            .lowercased()
        return Kind.allCases.first { $0.mime == bare }
    }

    // Everything the page sent, in the order a reader would check it: the
    // name, then the type and that the name's extension and the payload field
    // both belong to it, then the payload itself. Same order and codes as Kotlin.
    public static func check(fileName: String?, mimeType: String?, content: String?, base64: String?, text: String?) -> Result {
        guard let name = safeFileName(fileName) else {
            return .rejected(code: "BAD_NAME", message: "fileName must be a plain ASCII basename")
        }
        guard let kind = kindFor(mimeType) else {
            return .rejected(code: "BAD_TYPE", message: "type is not one this app exports")
        }
        if !name.hasSuffix(".\(kind.fileExtension)") {
            return .rejected(code: "BAD_TYPE", message: "a \(kind.mime) file must end in .\(kind.fileExtension)")
        }
        if (content == nil) == (base64 == nil) {
            return .rejected(code: "BAD_CONTENT", message: "send exactly one of content or base64")
        }
        let sentAs: Payload = content != nil ? .text : .base64
        if sentAs != kind.payload {
            return .rejected(code: "BAD_TYPE", message: "\(kind.mime) is sent as \(kind.payload == .text ? "text" : "base64")")
        }

        let bytes: Data
        switch kind.payload {
        case .text:
            bytes = Data(content!.utf8)
        case .base64:
            // Cheap length test before allocating: n decoded bytes take 4·⌈n/3⌉ characters.
            if base64!.utf16.count > (kind.maxBytes + 2) / 3 * 4 {
                return .rejected(code: "TOO_LARGE", message: "file too large")
            }
            guard let decoded = decodeBase64(base64!) else {
                return .rejected(code: "BAD_CONTENT", message: "base64 is malformed")
            }
            bytes = decoded
        }
        if bytes.count > kind.maxBytes { return .rejected(code: "TOO_LARGE", message: "file too large") }
        if let magic = kind.magic, !(bytes.count >= magic.count && Array(bytes.prefix(magic.count)) == magic) {
            return .rejected(code: "BAD_CONTENT", message: "bytes are not a \(kind.mime)")
        }
        return .ok(Accepted(kind: kind, name: name, bytes: bytes, text: shareText(text)))
    }

    // Nil for no caption; otherwise at most maxShareText UTF-16 units, never
    // splitting a surrogate pair.
    public static func shareText(_ raw: String?) -> String? {
        guard let raw = raw, !raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
        let units = Array(raw.utf16)
        if units.count <= maxShareText { return raw }
        var end = maxShareText
        if UTF16.isLeadSurrogate(units[end - 1]) { end -= 1 }
        return String(decoding: units[0..<end], as: UTF16.self)
    }

    private static let alphabet = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".utf16)
    private static let decodeTable: [Int] = {
        var table = [Int](repeating: -1, count: 128)
        for (i, c) in alphabet.enumerated() { table[Int(c)] = i }
        return table
    }()

    // Strict RFC 4648 §4 base64: standard alphabet, padded to a multiple of 4,
    // '=' only as the last one or two characters, no whitespace, no `data:`
    // prefix, and the unused bits of the last group zero (so one byte string
    // has exactly one spelling). Nil on anything else. Foundation's
    // Data(base64Encoded:) is not used because it accepts non-zero spare bits.
    public static func decodeBase64(_ string: String) -> Data? {
        let s = Array(string.utf16)
        if s.isEmpty || s.count % 4 != 0 { return nil }
        let eq: UInt16 = 0x3D
        let pad = s[s.count - 1] == eq ? (s[s.count - 2] == eq ? 2 : 1) : 0
        var out = [UInt8](repeating: 0, count: s.count / 4 * 3 - pad)
        var o = 0
        var i = 0
        while i < s.count {
            let last = i + 4 == s.count
            var v = [0, 0, 0, 0]
            for k in 0..<4 {
                let c = s[i + k]
                if last && c == eq && k >= 4 - pad { v[k] = 0; continue }
                if c >= 128 { return nil }
                let d = decodeTable[Int(c)]
                if d < 0 { return nil }
                v[k] = d
            }
            let n = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3]
            if last && pad == 2 && (v[1] & 0x0F) != 0 { return nil }
            if last && pad == 1 && (v[2] & 0x03) != 0 { return nil }
            out[o] = UInt8((n >> 16) & 0xFF); o += 1
            if o < out.count { out[o] = UInt8((n >> 8) & 0xFF); o += 1 }
            if o < out.count { out[o] = UInt8(n & 0xFF); o += 1 }
            i += 4
        }
        return Data(out)
    }

    // The file inside <base>/exports/, checked on the resolved path so no name
    // that slipped past safeFileName could ever point outside the folder.
    public static func target(base: URL, name: String) throws -> URL {
        let folder = base.appendingPathComponent(dir, isDirectory: true).resolvingSymlinksInPath().standardizedFileURL
        let file = folder.appendingPathComponent(name).resolvingSymlinksInPath().standardizedFileURL
        guard file.deletingLastPathComponent().standardizedFileURL.path == folder.path else { throw PathError.escapes }
        return file
    }

    // Deletes the regular files directly inside <base>/exports/ and nothing
    // else: no subfolder is entered, and a symlink is neither followed nor
    // removed, so this can never reach outside the folder. A missing folder,
    // or an exports/ that is itself a link, is left alone. Returns how many
    // files were deleted. FileManager.attributesOfItem does not follow a
    // link, so a link reports .typeSymbolicLink and is skipped.
    @discardableResult
    public static func clear(base: URL, fileManager: FileManager = .default) -> Int {
        let folder = base.appendingPathComponent(dir, isDirectory: true)
        guard (try? fileManager.attributesOfItem(atPath: folder.path)[.type] as? FileAttributeType) == .typeDirectory,
              let entries = try? fileManager.contentsOfDirectory(atPath: folder.path) else { return 0 }
        var deleted = 0
        for entry in entries {
            let path = folder.appendingPathComponent(entry).path
            guard (try? fileManager.attributesOfItem(atPath: path)[.type] as? FileAttributeType) == .typeRegular else { continue }
            if (try? fileManager.removeItem(atPath: path)) != nil { deleted += 1 }
        }
        return deleted
    }

    // One file at a time: the folder is emptied first, so an old export never
    // lingers beside the new one. Written to a hidden temp name and moved into
    // place, so a receiving app can never read half a file. Emptying on each
    // new share can pull a file out from under a receiver still reading an
    // earlier one; accepted, as on Android: one export at a time.
    public static func write(base: URL, name: String, bytes: Data, fileManager: FileManager = .default) throws -> URL {
        let file = try target(base: base, name: name)
        let folder = file.deletingLastPathComponent()
        try fileManager.createDirectory(at: folder, withIntermediateDirectories: true)
        clear(base: base, fileManager: fileManager)
        let temp = folder.appendingPathComponent(".\(name).tmp")
        try bytes.write(to: temp)
        do {
            try fileManager.moveItem(at: temp, to: file)
        } catch {
            try? fileManager.removeItem(at: temp)
            throw error
        }
        return file
    }
}
