package com.musicplayer.media

import android.content.Intent
import android.media.AudioAttributes as PlatformAudioAttributes
import android.os.Handler
import android.os.Looper
import androidx.media3.common.AudioAttributes
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

class PlaybackService : MediaSessionService() {
  lateinit var player: ExoPlayer
    private set
  private var session: MediaSession? = null
  private val main = Handler(Looper.getMainLooper())
  private var sleepTask: Runnable? = null
  private var repeatStartMs = -1L
  private var repeatEndMs = -1L
  private val repeatCheck = object : Runnable {
    override fun run() {
      if (repeatStartMs >= 0 && player.isPlaying && player.currentPosition >= repeatEndMs) {
        player.seekTo(repeatStartMs)
      }
      main.postDelayed(this, 100)
    }
  }

  override fun onCreate() {
    super.onCreate()
    player = ExoPlayer.Builder(this).build().apply {
      setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(PlatformAudioAttributes.USAGE_MEDIA)
          .setContentType(PlatformAudioAttributes.CONTENT_TYPE_MUSIC)
          .build(),
        true,
      )
      setHandleAudioBecomingNoisy(true)
    }
    session = MediaSession.Builder(this, player).build()
    instance = this
    main.post(repeatCheck)
  }

  fun setSleepTimer(seconds: Int) {
    sleepTask?.let(main::removeCallbacks)
    sleepTask = null
    if (seconds > 0) {
      val task = Runnable { player.pause(); sleepTask = null }
      sleepTask = task
      main.postDelayed(task, seconds * 1000L)
    }
  }

  fun setABRepeat(startMs: Long, endMs: Long) {
    repeatStartMs = startMs
    repeatEndMs = endMs
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

  override fun onDestroy() {
    main.removeCallbacks(repeatCheck)
    sleepTask?.let(main::removeCallbacks)
    instance = null
    session?.release()
    player.release()
    super.onDestroy()
  }

  companion object {
    @Volatile var instance: PlaybackService? = null
      private set
  }
}
