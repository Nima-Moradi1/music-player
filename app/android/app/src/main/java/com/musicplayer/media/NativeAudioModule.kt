package com.musicplayer.media

import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.io.File

class NativeAudioModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val main = Handler(Looper.getMainLooper())
  override fun getName() = "NativeAudio"

  private fun withPlayer(promise: Promise, action: (Player) -> Any?) {
    if (PlaybackService.instance == null) {
      context.startService(Intent(context, PlaybackService::class.java))
    }
    main.post {
      try {
        val player = PlaybackService.instance?.player ?: error("Audio service unavailable")
        promise.resolve(action(player))
      } catch (error: Exception) {
        promise.reject("PLAYBACK_ERROR", error.message, error)
      }
    }
  }

  @ReactMethod fun load(uri: String, title: String, artist: String, promise: Promise) = withPlayer(promise) { player ->
    val file = File(Uri.parse(uri).path ?: "").canonicalFile
    val folder = File(context.filesDir, "media/audio").canonicalFile
    require(file.path.startsWith(folder.path + File.separator) && file.isFile) { "Track file unavailable" }
    val item = MediaItem.Builder()
      .setUri(Uri.fromFile(file))
      .setMediaMetadata(MediaMetadata.Builder().setTitle(title).setArtist(artist).build())
      .build()
    player.setMediaItem(item)
    PlaybackService.instance?.setABRepeat(-1, -1)
    player.prepare()
    null
  }
  @ReactMethod fun play(promise: Promise) = withPlayer(promise) { it.play(); null }
  @ReactMethod fun pause(promise: Promise) = withPlayer(promise) { it.pause(); null }
  @ReactMethod fun stop(promise: Promise) = withPlayer(promise) { it.stop(); it.clearMediaItems(); null }
  @ReactMethod fun seekTo(ms: Double, promise: Promise) = withPlayer(promise) { it.seekTo(ms.toLong().coerceAtLeast(0)); null }
  @ReactMethod fun setRate(rate: Double, promise: Promise) = withPlayer(promise) {
    require(rate in 0.5..2.0) { "Invalid playback rate" }
    it.playbackParameters = PlaybackParameters(rate.toFloat()); null
  }
  @ReactMethod fun setVolume(value: Double, promise: Promise) = withPlayer(promise) {
    require(value in 0.0..1.0) { "Invalid volume" }; it.volume = value.toFloat(); null
  }
  @ReactMethod fun setSleepTimer(seconds: Double, promise: Promise) = withPlayer(promise) {
    require(seconds.isFinite() && seconds >= 0 && seconds <= 86400) { "Invalid sleep timer" }
    PlaybackService.instance?.setSleepTimer(seconds.toInt()); null
  }
  @ReactMethod fun setABRepeat(startMs: Double, endMs: Double, promise: Promise) = withPlayer(promise) {
    require((startMs == -1.0 && endMs == -1.0) ||
      (startMs.isFinite() && endMs.isFinite() && startMs >= 0 && endMs > startMs)) { "Invalid A-B repeat" }
    PlaybackService.instance?.setABRepeat(startMs.toLong(), endMs.toLong()); null
  }
  @ReactMethod fun getState(promise: Promise) = withPlayer(promise) { player ->
    JSONObject().apply {
      put("playing", player.isPlaying)
      put("ended", player.playbackState == Player.STATE_ENDED)
      put("positionMs", player.currentPosition.coerceAtLeast(0))
      put("durationMs", player.duration.takeIf { it != C.TIME_UNSET && it >= 0 } ?: 0)
    }.toString()
  }
}
