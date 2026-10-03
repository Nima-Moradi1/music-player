package com.musicplayer.media

import java.io.DataInputStream
import java.io.File
import java.io.FileInputStream
import java.nio.charset.Charset

/** Bounded ID3v2 USLT extraction. Unsupported frames are ignored safely. */
internal object EmbeddedLyrics {
  fun read(file: File): String? {
    return try {
      DataInputStream(FileInputStream(file)).use { input ->
      val header = ByteArray(10)
      input.readFully(header)
      if (String(header, 0, 3, Charsets.US_ASCII) != "ID3") return null
      val version = header[3].toInt() and 0xff
      if (version !in 3..4 || (header[5].toInt() and 0x80) != 0) return null
      val size = syncSafe(header, 6)
      if (size <= 0 || size > 1_048_576) return null
      val tag = ByteArray(size)
      input.readFully(tag)
      var offset = 0
      while (offset + 10 <= tag.size) {
        val name = String(tag, offset, 4, Charsets.US_ASCII)
        if (!name.all { it in 'A'..'Z' || it in '0'..'9' }) break
        val frameSize = if (version == 4) syncSafe(tag, offset + 4) else bigEndian(tag, offset + 4)
        val start = offset + 10
        if (frameSize <= 0 || start + frameSize > tag.size) break
        if (name == "USLT" && tag[offset + 8] == 0.toByte() && tag[offset + 9] == 0.toByte()) {
          decode(tag, start, frameSize)?.let { return it }
        }
        offset = start + frameSize
      }
      null
      }
    } catch (_: Exception) { null }
  }

  private fun decode(bytes: ByteArray, start: Int, size: Int): String? {
    if (size < 5 || size > 200_000) return null
    val encoding = bytes[start].toInt() and 0xff
    val charset: Charset = when (encoding) {
      0 -> Charsets.ISO_8859_1
      1 -> Charsets.UTF_16
      2 -> Charsets.UTF_16BE
      3 -> Charsets.UTF_8
      else -> return null
    }
    val end = start + size
    var cursor = start + 4 // encoding byte + three-byte language code
    val wide = encoding == 1 || encoding == 2
    while (cursor < end) {
      if (bytes[cursor] == 0.toByte() && (!wide || (cursor + 1 < end && bytes[cursor + 1] == 0.toByte()))) {
        cursor += if (wide) 2 else 1
        break
      }
      cursor += if (wide) 2 else 1
    }
    if (cursor >= end) return null
    val lyrics = String(bytes, cursor, end - cursor, charset).trim('\u0000', ' ', '\n', '\r')
    return lyrics.takeIf { it.isNotEmpty() && it.length <= 100_000 }
  }

  private fun syncSafe(bytes: ByteArray, start: Int): Int =
    ((bytes[start].toInt() and 0x7f) shl 21) or
      ((bytes[start + 1].toInt() and 0x7f) shl 14) or
      ((bytes[start + 2].toInt() and 0x7f) shl 7) or
      (bytes[start + 3].toInt() and 0x7f)

  private fun bigEndian(bytes: ByteArray, start: Int): Int =
    ((bytes[start].toInt() and 0xff) shl 24) or
      ((bytes[start + 1].toInt() and 0xff) shl 16) or
      ((bytes[start + 2].toInt() and 0xff) shl 8) or
      (bytes[start + 3].toInt() and 0xff)
}
