package com.musicplayer.media

import android.media.MediaMetadataRetriever
import android.net.Uri
import com.facebook.react.bridge.*
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import org.json.JSONObject
import org.json.JSONArray

class ManagedMediaModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val executor = Executors.newFixedThreadPool(2)
  private val jobs = ConcurrentHashMap<String, AtomicBoolean>()
  private val root get() = File(context.filesDir, "media")
  override fun getName() = "ManagedMedia"
  private fun checked(path: String): File {
    val file = File(Uri.parse(path).path ?: path).canonicalFile
    require(file.path.startsWith(root.canonicalPath + File.separator)) { "PERMISSION_DENIED" }
    return file
  }
  private fun task(id: String, promise: Promise, work: (AtomicBoolean) -> Any?) {
    val cancelled = AtomicBoolean(false); jobs[id] = cancelled
    executor.execute {
      try { promise.resolve(work(cancelled)) }
      catch (error: Exception) {
        val code = error.message?.takeIf { it.startsWith("IMPORT_") || it == "PERMISSION_DENIED" } ?: "IMPORT_CORRUPT_FILE"
        promise.reject(code, code)
      } finally { jobs.remove(id) }
    }
  }
  @ReactMethod fun createId(promise: Promise) { promise.resolve(UUID.randomUUID().toString()) }
  @ReactMethod fun cancel(id: String) { jobs[id]?.set(true) }
  @ReactMethod fun freeBytes(promise: Promise) { promise.resolve(context.filesDir.usableSpace.toDouble()) }
  @ReactMethod fun reconcile(ownedPathsJson: String, promise: Promise) = task(UUID.randomUUID().toString(), promise) { _ ->
    val paths = JSONArray(ownedPathsJson)
    val owned = (0 until paths.length()).map { checked(paths.getString(it)).canonicalPath }.toSet()
    for (name in listOf("temp", "audio", "artwork")) {
      val folder = File(root, name)
      folder.listFiles()?.forEach { candidate ->
        val file = checked(candidate.path)
        if (file.isFile && (name == "temp" || file.canonicalPath !in owned)) {
          require(file.delete()) { "PERMISSION_DENIED" }
        }
      }
    }
    null
  }
  @ReactMethod fun stage(id: String, uri: String, maxBytes: Double, promise: Promise) = task(id, promise) { cancelled ->
    require(maxBytes > 0 && maxBytes <= 1024L * 1024 * 1024) { "IMPORT_NO_SPACE" }
    val folder = File(root, "temp").apply { mkdirs() }
    val target = File(folder, UUID.randomUUID().toString() + ".part")
    try {
      context.contentResolver.openInputStream(Uri.parse(uri)).use { input ->
        requireNotNull(input) { "PERMISSION_DENIED" }
        target.outputStream().use { output ->
          val buffer = ByteArray(65536); var total = 0L
          while (true) {
            if (cancelled.get()) throw IllegalStateException("Cancelled")
            val read = input.read(buffer); if (read < 0) break
            total += read
            require(total <= maxBytes && context.filesDir.usableSpace > read + 1024 * 1024) { "IMPORT_NO_SPACE" }
            output.write(buffer, 0, read)
          }
          require(total > 0) { "IMPORT_CORRUPT_FILE" }; output.fd.sync()
        }
      }
      Uri.fromFile(target).toString()
    } catch (error: Exception) { target.delete(); throw error }
  }
  @ReactMethod fun inspect(id: String, path: String, promise: Promise) = task(id, promise) { cancelled ->
    val file = checked(path)
    val header = FileInputStream(file).use { input ->
      val bytes = ByteArray(12)
      require(input.read(bytes) == 12) { "IMPORT_CORRUPT_FILE" }
      bytes
    }
    val (mime, extension) = MediaSafety.format(header)
    val digest = MessageDigest.getInstance("SHA-256")
    FileInputStream(file).use { input ->
      val buffer = ByteArray(65536)
      while (true) {
        if (cancelled.get()) throw IllegalStateException("Cancelled")
        val read = input.read(buffer); if (read < 0) break; digest.update(buffer, 0, read)
      }
    }
    val metadata = MediaMetadataRetriever()
    try {
      metadata.setDataSource(file.path)
      require(metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_HAS_VIDEO) != "yes") { "IMPORT_UNSUPPORTED_FORMAT" }
      val duration = metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0
      require(duration > 0) { "IMPORT_CORRUPT_FILE" }
      JSONObject().apply {
        put("path", path); put("sha256", digest.digest().joinToString("") { "%02x".format(it) })
        put("mimeType", mime); put("extension", extension); put("fileSize", file.length())
        put("title", metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE) ?: "")
        put("artist", metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST) ?: "")
        put("album", metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM) ?: "")
        put("genre", metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_GENRE) ?: "")
        put("durationMs", duration); put("artworkPath", JSONObject.NULL)
      }.toString()
    } finally { metadata.release() }
  }
  @ReactMethod fun promote(path: String, hash: String, extension: String, promise: Promise) = task(UUID.randomUUID().toString(), promise) { _ ->
    val source = checked(path)
    val target = File(File(root, "audio").apply { mkdirs() }, MediaSafety.safeTarget(hash, extension))
    if (target.exists()) { source.delete() } else { require(source.renameTo(target)) { "IMPORT_NO_SPACE" } }
    Uri.fromFile(target).toString()
  }
  @ReactMethod fun remove(path: String, promise: Promise) = task(UUID.randomUUID().toString(), promise) { _ ->
    val target = checked(path); require(!target.exists() || target.delete()) { "PERMISSION_DENIED" }; null
  }
  override fun invalidate() { jobs.values.forEach { it.set(true) }; executor.shutdown(); super.invalidate() }
}

class ManagedMediaPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(ManagedMediaModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
