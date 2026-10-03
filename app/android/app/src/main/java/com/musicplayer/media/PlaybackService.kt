package com.musicplayer.media

import android.content.Intent
import android.media.AudioAttributes as PlatformAudioAttributes
import androidx.media3.common.AudioAttributes
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

class PlaybackService : MediaSessionService() {
  lateinit var player: ExoPlayer
    private set
  private var session: MediaSession? = null

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
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

  override fun onDestroy() {
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
