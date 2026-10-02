import AVFoundation
import CryptoKit
import Foundation
import ImageIO
import UniformTypeIdentifiers
import React
import UIKit

@objc(ManagedMedia)
final class ManagedMedia: NSObject {
  private let lock = NSLock()
  private var cancelled = Set<String>()
  private let files = FileManager.default
  private var root: URL {
    let base = files.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    return base.appendingPathComponent("media", isDirectory: true)
  }
  @objc static func requiresMainQueueSetup() -> Bool { false }
  private func check(_ id: String) throws {
    lock.lock(); let stop = cancelled.contains(id); lock.unlock()
    if stop { throw MediaError.code("UNKNOWN") }
  }
  private func finish(_ id: String) { lock.lock(); cancelled.remove(id); lock.unlock() }
  private func checked(_ path: String) throws -> URL {
    let url = (URL(string: path)?.isFileURL == true ? URL(string: path)! : URL(fileURLWithPath: path)).resolvingSymlinksInPath()
    guard url.path.hasPrefix(root.resolvingSymlinksInPath().path + "/") else { throw MediaError.code("PERMISSION_DENIED") }
    return url
  }
  private func folder(_ name: String) throws -> URL {
    var url = root.appendingPathComponent(name, isDirectory: true)
    try files.createDirectory(at: url, withIntermediateDirectories: true)
    var values = URLResourceValues(); values.isExcludedFromBackup = true
    try url.setResourceValues(values)
    return url
  }
  private func failure(_ error: Error, _ reject: RCTPromiseRejectBlock) {
    let code: String
    if case MediaError.code(let value) = error { code = value }
    else { code = "IMPORT_CORRUPT_FILE" }
    reject(code, code, nil)
  }
  @objc func createId(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) { resolve(UUID().uuidString.lowercased()) }
  @objc func cancel(_ id: String) { lock.lock(); cancelled.insert(id); lock.unlock() }
  @objc func freeBytes(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    do { let values = try files.attributesOfFileSystem(forPath: NSHomeDirectory()); resolve((values[.systemFreeSize] as? NSNumber)?.doubleValue ?? 0) }
    catch { failure(error, reject) }
  }
  @objc func reconcile(_ ownedPathsJson: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .utility).async {
      do {
        guard let data = ownedPathsJson.data(using: .utf8), let paths = try JSONSerialization.jsonObject(with: data) as? [String] else { throw MediaError.code("PERMISSION_DENIED") }
        let owned = Set(try paths.map { try self.checked($0).path })
        for name in ["temp", "audio", "artwork"] {
          let folder = try self.folder(name)
          for candidate in try self.files.contentsOfDirectory(at: folder, includingPropertiesForKeys: [.isRegularFileKey]) {
            let url = try self.checked(candidate.absoluteString)
            if try url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile == true && (name == "temp" || !owned.contains(url.path)) {
              try self.files.removeItem(at: url)
            }
          }
        }
        resolve(nil)
      } catch { self.failure(error, reject) }
    }
  }
  @objc func stage(_ id: String, uri: String, maxBytes: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .utility).async {
      defer { self.finish(id) }
      var target: URL?
      do {
        guard maxBytes > 0, maxBytes <= 1_073_741_824, let source = URL(string: uri), source.isFileURL else { throw MediaError.code("PERMISSION_DENIED") }
        let scope = source.startAccessingSecurityScopedResource(); defer { if scope { source.stopAccessingSecurityScopedResource() } }
        let destination = try self.folder("temp").appendingPathComponent(UUID().uuidString + ".part"); target = destination
        self.files.createFile(atPath: destination.path, contents: nil)
        let input = try FileHandle(forReadingFrom: source), output = try FileHandle(forWritingTo: destination)
        defer { try? input.close(); try? output.close() }
        var total = 0
        while let buffer = try input.read(upToCount: 65_536), !buffer.isEmpty {
          try self.check(id); total += buffer.count
          guard Double(total) <= maxBytes else { throw MediaError.code("IMPORT_NO_SPACE") }
          try output.write(contentsOf: buffer)
        }
        guard total > 0 else { throw MediaError.code("IMPORT_CORRUPT_FILE") }
        try output.synchronize(); resolve(destination.absoluteString)
      } catch { if let target { try? self.files.removeItem(at: target) }; self.failure(error, reject) }
    }
  }
  @objc func inspect(_ id: String, path: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task.detached(priority: .utility) {
      defer { self.finish(id) }
      do {
        let url = try self.checked(path), input = try FileHandle(forReadingFrom: url)
        defer { try? input.close() }
        guard let header = try input.read(upToCount: 12), header.count == 12 else { throw MediaError.code("IMPORT_CORRUPT_FILE") }
        let bytes = [UInt8](header)
        let signature = String(data: header, encoding: .isoLatin1) ?? ""
        let mime: String, ext: String
        if signature.hasPrefix("fLaC") { mime = "audio/flac"; ext = "flac" }
        else if String(signature.dropFirst(4).prefix(4)) == "ftyp" { mime = "audio/mp4"; ext = "m4a" }
        else if signature.hasPrefix("ID3") { mime = "audio/mpeg"; ext = "mp3" }
        else if bytes[0] == 255 && bytes[1] & 246 == 240 { mime = "audio/aac"; ext = "aac" }
        else if bytes[0] == 255 && bytes[1] & 224 == 224 && bytes[1] & 6 != 0 { mime = "audio/mpeg"; ext = "mp3" }
        else { throw MediaError.code("IMPORT_UNSUPPORTED_FORMAT") }
        try input.seek(toOffset: 0); var hash = SHA256()
        while let buffer = try input.read(upToCount: 65_536), !buffer.isEmpty { try self.check(id); hash.update(data: buffer) }
        let asset = AVURLAsset(url: url)
        let duration = try await asset.load(.duration)
        let audio = try await asset.loadTracks(withMediaType: .audio)
        let video = try await asset.loadTracks(withMediaType: .video)
        guard !audio.isEmpty, video.isEmpty, duration.seconds.isFinite, duration.seconds > 0 else { throw MediaError.code("IMPORT_CORRUPT_FILE") }
        let metadata = try await asset.load(.commonMetadata)
        func value(_ key: AVMetadataKey) async -> String {
          guard let item = metadata.first(where: { $0.commonKey == key }) else { return "" }
          return (try? await item.load(.stringValue)) ?? ""
        }
        let size = (try self.files.attributesOfItem(atPath: url.path)[.size] as? NSNumber)?.int64Value ?? 0
        let digest = hash.finalize().map { String(format: "%02x", $0) }.joined()
        var artwork: String?
        if let item = metadata.first(where: { $0.commonKey == .commonKeyArtwork }),
           let data = try? await item.load(.dataValue), data.count <= 8 * 1024 * 1024 {
          artwork = try self.extractArtwork(data, hash: digest)
        }
        let object: [String: Any] = ["path": path, "sha256": digest,
          "mimeType": mime, "extension": ext, "fileSize": size, "durationMs": Int(duration.seconds * 1000),
          "title": await value(.commonKeyTitle), "artist": await value(.commonKeyArtist), "album": await value(.commonKeyAlbumName),
          "genre": await value(.commonKeyType), "artworkPath": artwork as Any? ?? NSNull()]
        try self.check(id)
        resolve(String(data: try JSONSerialization.data(withJSONObject: object), encoding: .utf8))
      } catch { self.failure(error, reject) }
    }
  }
  private func extractArtwork(_ data: Data, hash: String) throws -> String? {
    let target = try folder("artwork").appendingPathComponent(hash + ".jpg")
    if files.fileExists(atPath: target.path) { return target.absoluteString }
    guard let source = CGImageSourceCreateWithData(data as CFData, nil),
          let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceThumbnailMaxPixelSize: 512,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceShouldCacheImmediately: false
          ] as CFDictionary) else { return nil }
    let output = NSMutableData()
    guard let destination = CGImageDestinationCreateWithData(output, UTType.jpeg.identifier as CFString, 1, nil) else { return nil }
    CGImageDestinationAddImage(destination, image, [kCGImageDestinationLossyCompressionQuality: 0.85] as CFDictionary)
    guard CGImageDestinationFinalize(destination) else { return nil }
    try (output as Data).write(to: target, options: .atomic)
    return target.absoluteString
  }
  @objc func promote(_ path: String, hash: String, ext: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .utility).async {
      do {
        guard hash.range(of: "^[a-f0-9]{64}$", options: .regularExpression) != nil, ["mp3","flac","m4a","aac"].contains(ext) else { throw MediaError.code("IMPORT_CORRUPT_FILE") }
        let source = try self.checked(path), target = try self.folder("audio").appendingPathComponent(hash + "." + ext)
        if self.files.fileExists(atPath: target.path) { try self.files.removeItem(at: source) }
        else { try self.files.moveItem(at: source, to: target) }
        resolve(target.absoluteString)
      } catch { self.failure(error, reject) }
    }
  }
  @objc func remove(_ path: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do { let url = try checked(path); if files.fileExists(atPath: url.path) { try files.removeItem(at: url) }; resolve(nil) }
    catch { failure(error, reject) }
  }
}
private enum MediaError: Error { case code(String) }


@objc(Haptics)
final class Haptics: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }
  @objc func feedback(_ kind: String) {
    DispatchQueue.main.async {
      switch kind {
      case "selection": UISelectionFeedbackGenerator().selectionChanged()
      case "success": UINotificationFeedbackGenerator().notificationOccurred(.success)
      case "error": UINotificationFeedbackGenerator().notificationOccurred(.error)
      default: break
      }
    }
  }
}
