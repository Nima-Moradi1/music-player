import AVFoundation
import Foundation
import MediaPlayer
import React

@objc(NativeAudio)
final class NativeAudio: NSObject {
  private var player: AVPlayer?
  private var ended = false
  private var title = ""
  private var artist = ""
  private var observers: [NSObjectProtocol] = []
  private var sleepTask: DispatchWorkItem?
  private var repeatStartMs = -1.0
  private var repeatEndMs = -1.0
  private var repeatObserver: Any?

  @objc static func requiresMainQueueSetup() -> Bool { true }
  @objc func methodQueue() -> DispatchQueue { DispatchQueue.main }

  override init() {
    super.init()
    let commands = MPRemoteCommandCenter.shared()
    commands.playCommand.addTarget { [weak self] _ in self?.player?.play(); self?.updateNowPlaying(); return .success }
    commands.pauseCommand.addTarget { [weak self] _ in self?.player?.pause(); self?.updateNowPlaying(); return .success }
    commands.changePlaybackPositionCommand.addTarget { [weak self] event in
      guard let event = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
      self?.player?.seek(to: CMTime(seconds: event.positionTime, preferredTimescale: 1000))
      self?.updateNowPlaying()
      return .success
    }
    observers.append(NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: nil, queue: .main) { [weak self] _ in
      self?.ended = true
      self?.updateNowPlaying()
    })
    observers.append(NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] notification in
      guard let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
      if type == .began { self?.player?.pause(); self?.updateNowPlaying() }
    })
    observers.append(NotificationCenter.default.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] notification in
      guard let raw = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
            raw == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue else { return }
      self?.player?.pause()
      self?.updateNowPlaying()
    })
  }

  deinit {
    sleepTask?.cancel()
    if let repeatObserver, let player { player.removeTimeObserver(repeatObserver) }
    observers.forEach(NotificationCenter.default.removeObserver)
    MPRemoteCommandCenter.shared().playCommand.removeTarget(nil)
    MPRemoteCommandCenter.shared().pauseCommand.removeTarget(nil)
    MPRemoteCommandCenter.shared().changePlaybackPositionCommand.removeTarget(nil)
  }

  private func updateNowPlaying() {
    guard let player else { MPNowPlayingInfoCenter.default().nowPlayingInfo = nil; return }
    let duration = player.currentItem?.duration.seconds ?? 0
    MPNowPlayingInfoCenter.default().nowPlayingInfo = [
      MPMediaItemPropertyTitle: title,
      MPMediaItemPropertyArtist: artist,
      MPMediaItemPropertyPlaybackDuration: duration.isFinite ? duration : 0,
      MPNowPlayingInfoPropertyElapsedPlaybackTime: player.currentTime().seconds.isFinite ? player.currentTime().seconds : 0,
      MPNowPlayingInfoPropertyPlaybackRate: player.rate,
    ]
  }

  @objc func load(_ uri: String, title: String, artist: String, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let url = URL(string: uri), url.isFileURL else { reject("PLAYBACK_ERROR", "Invalid track URI", nil); return }
    let file = url.resolvingSymlinksInPath()
    let folder = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("media/audio").resolvingSymlinksInPath()
    guard file.path.hasPrefix(folder.path + "/"), FileManager.default.fileExists(atPath: file.path) else {
      reject("PLAYBACK_ERROR", "Track file unavailable", nil); return
    }
    do {
      try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
      try AVAudioSession.sharedInstance().setActive(true)
      if let repeatObserver, let player { player.removeTimeObserver(repeatObserver) }
      player?.pause()
      player = AVPlayer(url: file)
      repeatStartMs = -1
      repeatEndMs = -1
      repeatObserver = player?.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.1, preferredTimescale: 1000), queue: .main) { [weak self] time in
        guard let self, self.repeatStartMs >= 0, self.repeatEndMs > self.repeatStartMs,
              time.seconds * 1000 >= self.repeatEndMs else { return }
        self.player?.seek(to: CMTime(seconds: self.repeatStartMs / 1000, preferredTimescale: 1000))
      }
      self.title = title
      self.artist = artist
      ended = false
      updateNowPlaying()
      resolve(nil)
    } catch { reject("PLAYBACK_ERROR", error.localizedDescription, error) }
  }
  @objc func play(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let player else { reject("PLAYBACK_ERROR", "No track loaded", nil); return }
    player.play(); ended = false; updateNowPlaying(); resolve(nil)
  }
  @objc func pause(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    player?.pause(); updateNowPlaying(); resolve(nil)
  }
  @objc func stop(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if let repeatObserver, let player { player.removeTimeObserver(repeatObserver) }
    repeatObserver = nil
    player?.pause(); player = nil; updateNowPlaying(); resolve(nil)
  }
  @objc func seekTo(_ ms: Double, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard ms.isFinite, ms >= 0 else { reject("PLAYBACK_ERROR", "Invalid position", nil); return }
    player?.seek(to: CMTime(seconds: ms / 1000, preferredTimescale: 1000))
    updateNowPlaying()
    resolve(nil)
  }
  @objc func setRate(_ rate: Double, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard (0.5...2.0).contains(rate) else { reject("PLAYBACK_ERROR", "Invalid rate", nil); return }
    if let player, player.rate > 0 { player.rate = Float(rate) }
    resolve(nil)
  }
  @objc func setVolume(_ value: Double, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard (0...1).contains(value) else { reject("PLAYBACK_ERROR", "Invalid volume", nil); return }
    player?.volume = Float(value); resolve(nil)
  }
  @objc func setSleepTimer(_ seconds: Double, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard seconds.isFinite, (0...86400).contains(seconds) else { reject("PLAYBACK_ERROR", "Invalid sleep timer", nil); return }
    sleepTask?.cancel()
    sleepTask = nil
    if seconds > 0 {
      let task = DispatchWorkItem { [weak self] in self?.player?.pause(); self?.updateNowPlaying(); self?.sleepTask = nil }
      sleepTask = task
      DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: task)
    }
    resolve(nil)
  }
  @objc func setABRepeat(_ startMs: Double, endMs: Double, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard (startMs == -1 && endMs == -1) || (startMs.isFinite && endMs.isFinite && startMs >= 0 && endMs > startMs) else {
      reject("PLAYBACK_ERROR", "Invalid A-B repeat", nil); return
    }
    repeatStartMs = startMs
    repeatEndMs = endMs
    resolve(nil)
  }
  @objc func getState(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    let position = player?.currentTime().seconds ?? 0
    let duration = player?.currentItem?.duration.seconds ?? 0
    let state: [String: Any] = [
      "playing": (player?.rate ?? 0) > 0,
      "ended": ended,
      "positionMs": position.isFinite ? max(0, Int(position * 1000)) : 0,
      "durationMs": duration.isFinite ? max(0, Int(duration * 1000)) : 0,
    ]
    do { resolve(String(data: try JSONSerialization.data(withJSONObject: state), encoding: .utf8)) }
    catch { reject("PLAYBACK_ERROR", error.localizedDescription, error) }
  }
}
