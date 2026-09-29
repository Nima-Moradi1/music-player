package com.musicplayer.media

import org.junit.Assert.assertEquals
import org.junit.Test

class MediaSafetyTest {
  @Test fun recognizesFlacAndMp3Signatures() {
    assertEquals("flac", MediaSafety.format("fLaC00000000".toByteArray()).second)
    assertEquals("mp3", MediaSafety.format("ID3000000000".toByteArray()).second)
  }
  @Test(expected = IllegalArgumentException::class) fun rejectsExecutable() {
    MediaSafety.format("MZ0000000000".toByteArray())
  }
  @Test(expected = IllegalArgumentException::class) fun rejectsTraversal() {
    MediaSafety.safeTarget("../../outside", "mp3")
  }
}

