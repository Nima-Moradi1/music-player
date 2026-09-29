package com.musicplayer.media

object MediaSafety {
  fun format(header: ByteArray): Pair<String, String> {
    require(header.size >= 12) { "IMPORT_CORRUPT_FILE" }
    val ascii = String(header, Charsets.ISO_8859_1)
    if (ascii.startsWith("fLaC")) return Pair("audio/flac", "flac")
    if (ascii.substring(4, 8) == "ftyp") return Pair("audio/mp4", "m4a")
    if (ascii.startsWith("ID3")) return Pair("audio/mpeg", "mp3")
    val first = header[0].toInt() and 255
    val second = header[1].toInt() and 255
    if (first == 255 && (second and 246) == 240) return Pair("audio/aac", "aac")
    if (first == 255 && (second and 224) == 224 && (second and 6) != 0) return Pair("audio/mpeg", "mp3")
    throw IllegalArgumentException("IMPORT_UNSUPPORTED_FORMAT")
  }
  fun safeTarget(hash: String, extension: String): String {
    require(hash.matches(Regex("[a-f0-9]{64}"))) { "IMPORT_CORRUPT_FILE" }
    require(extension in listOf("mp3", "flac", "m4a", "aac")) { "IMPORT_UNSUPPORTED_FORMAT" }
    return "$hash.$extension"
  }
}

