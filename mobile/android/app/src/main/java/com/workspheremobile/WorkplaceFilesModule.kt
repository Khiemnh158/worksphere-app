package com.workspheremobile

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import java.io.File
import java.io.InputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/** Only app-created cache IDs cross this bridge; no bearer tokens or arbitrary paths/URLs. */
class WorkplaceFilesModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val store = WorkplaceFileStore(context)
    override fun getName() = "WorkplaceFiles"
    @ReactMethod fun resetAttachmentCache() { store.reset() }
    @ReactMethod fun releaseAttachment(id: String) { store.release(id) }
    @ReactMethod fun pickAttachment(promise: Promise) {
        val activity = reactApplicationContext.currentActivity as? MainActivity
        if (activity == null) { promise.reject("FILE_NO_ACTIVITY", "Không mở được bộ chọn tệp."); return }
        activity.runOnUiThread { activity.pickWorkplaceAttachment(store, promise) }
    }
    @ReactMethod fun cacheAttachment(base64: String, name: String, promise: Promise) {
        val epoch = store.epoch
        store.task(promise) { store.fromBase64(base64, name, epoch) }
    }
    @ReactMethod fun openAttachment(id: String, promise: Promise) {
        val activity = reactApplicationContext.currentActivity as? MainActivity
        if (activity == null) { promise.reject("FILE_NO_ACTIVITY", "Không mở được tệp."); return }
        val epoch = store.epoch
        activity.runOnUiThread {
            try {
                val entry = store.entry(id, epoch)
                val uri = store.uri(entry)
                val intent = Intent(Intent.ACTION_VIEW).setDataAndType(uri, entry.mime)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                intent.clipData = ClipData.newRawUri(entry.name, uri)
                activity.startActivity(Intent.createChooser(intent, "Mở tệp bằng"))
                promise.resolve(true)
            } catch (_: Exception) { promise.reject("FILE_OPEN_FAILED", "Không mở được tệp. Hãy chọn Lưu bản sao hoặc cài ứng dụng đọc định dạng này.") }
        }
    }
    @ReactMethod fun saveAttachment(id: String, promise: Promise) {
        val activity = reactApplicationContext.currentActivity as? MainActivity
        if (activity == null) { promise.reject("FILE_NO_ACTIVITY", "Không mở được nơi lưu tệp."); return }
        activity.runOnUiThread { activity.saveWorkplaceAttachment(store, id, promise) }
    }
    override fun invalidate() { store.reset(); super.invalidate() }
}

internal class WorkplaceFileStore(private val context: Context) {
    data class Entry(val id: String, val file: File, val name: String, val mime: String)
    @Volatile var epoch: Long = 0; private set
    private val entries = ConcurrentHashMap<String, Entry>()
    private val executor = Executors.newSingleThreadExecutor()
    private val folder: File get() = File(context.cacheDir, "workplace-files").also { it.mkdirs() }
    init { reset() } // A new JS/native runtime never adopts a previous runtime's documents.
    @Synchronized fun reset() {
        epoch++
        val old = entries.values.toList()
        entries.clear()
        old.forEach { runCatching { context.revokeUriPermission(uri(it), Intent.FLAG_GRANT_READ_URI_PERMISSION) } }
        // Single queue: old writes finish/check their epoch before the purge; new writes follow it.
        executor.execute { folder.listFiles()?.forEach { it.delete() } }
    }
    fun release(id: String) {
        val item = entries.remove(id) ?: return
        runCatching { context.revokeUriPermission(uri(item), Intent.FLAG_GRANT_READ_URI_PERMISSION) }
        executor.execute { item.file.delete() }
    }
    fun task(promise: Promise, operation: () -> Any?) {
        executor.execute {
            try { promise.resolve(operation()) }
            catch (e: Exception) { promise.reject("FILE_OPERATION_FAILED", e.message?.takeIf { e is IllegalArgumentException } ?: "Không đọc hoặc lưu được tệp. Hãy thử lại.") }
        }
    }
    fun requireEpoch(expected: Long) { require(epoch == expected) { "Phiên đã thay đổi. Hãy chọn hoặc tải lại tệp." } }
    fun entry(id: String, expected: Long): Entry {
        requireEpoch(expected)
        val item = entries[id] ?: throw IllegalArgumentException("Tệp tạm đã hết hạn. Hãy tải lại.")
        require(item.file.isFile && item.file.lastModified() > System.currentTimeMillis()-86_400_000) { "Tệp tạm đã hết hạn. Hãy tải lại." }
        return item
    }
    fun uri(item: Entry): Uri = FileProvider.getUriForFile(context, "${context.packageName}.workplacefiles", item.file)
    private fun attributes(input: String): Pair<String,String> {
        val name = input.substringAfterLast('/').substringAfterLast('\\').filter { !it.isISOControl() }.trim()
        require(name.isNotBlank() && name.length <= 255) { "Tên tệp không hợp lệ." }
        val mime = MIME[name.substringAfterLast('.', "").lowercase()] ?: throw IllegalArgumentException("Chỉ hỗ trợ JPG, PNG, WEBP, PDF, DOCX và XLSX.")
        return name to mime
    }
    private fun store(stream: InputStream, name: String, mime: String, expected: Long): WritableMap {
        requireEpoch(expected)
        entries.values.filter { it.file.lastModified() < System.currentTimeMillis()-86_400_000 }.forEach { release(it.id) }
        require((folder.listFiles()?.sumOf { it.length() } ?: 0) < 96L*1024*1024) { "Bộ nhớ tệp tạm đang đầy. Đăng xuất để dọn vùng tạm rồi thử lại." }
        val id = UUID.randomUUID().toString()
        val output = File(folder, "$id.${name.substringAfterLast('.').lowercase()}")
        val limit = if (mime.startsWith("image/")) 10L*1024*1024 else 20L*1024*1024
        try {
            var count = 0L
            output.outputStream().use { sink ->
                val buffer = ByteArray(32768)
                while (true) {
                    val n = stream.read(buffer)
                    if (n < 0) break
                    requireEpoch(expected)
                    count += n
                    require(count <= limit) { "Tệp vượt giới hạn ${limit/1024/1024} MB." }
                    sink.write(buffer,0,n)
                }
            }
            require(count > 0) { "Tệp không được rỗng." }
            synchronized(this) {
                requireEpoch(expected)
                entries[id] = Entry(id, output, name, mime)
            }
            return Arguments.createMap().apply {
                putString("cacheId",id); putString("uri",Uri.fromFile(output).toString())
                putString("name",name); putString("type",mime); putDouble("size",count.toDouble())
            }
        } catch (e: Exception) { output.delete(); throw e }
    }
    fun importDocument(uri: Uri, expected: Long): WritableMap {
        requireEpoch(expected)
        require(uri.scheme == "content") { "Nguồn tệp không hợp lệ." }
        var name = ""
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME),null,null,null)?.use { cursor ->
            if (cursor.moveToFirst()) name = cursor.getString(0) ?: ""
        }
        val (clean, mime) = attributes(name)
        return context.contentResolver.openInputStream(uri)?.use { store(it,clean,mime,expected) }
            ?: throw IllegalArgumentException("Không đọc được tệp đã chọn.")
    }
    fun fromBase64(value: String, name: String, expected: Long): WritableMap {
        requireEpoch(expected)
        require(value.length <= 28*1024*1024 && value.matches(Regex("[A-Za-z0-9+/]*={0,2}"))) { "Dữ liệu tệp không hợp lệ hoặc quá lớn." }
        val (clean,mime) = attributes(name)
        return Base64.decode(value,Base64.DEFAULT).inputStream().use { store(it,clean,mime,expected) }
    }
    fun exportDocument(id: String, destination: Uri, expected: Long): Boolean {
        val item = entry(id,expected)
        require(destination.scheme == "content") { "Nơi lưu không hợp lệ." }
        context.contentResolver.openOutputStream(destination,"w")?.use { sink ->
            item.file.inputStream().use { source ->
                val buffer=ByteArray(32768)
                while(true) {
                    val n=source.read(buffer); if(n<0) break
                    requireEpoch(expected); sink.write(buffer,0,n)
                }
            }
        } ?: throw IllegalArgumentException("Không ghi được vào nơi đã chọn.")
        return true
    }
    companion object {
        val MIME = mapOf("jpg" to "image/jpeg", "jpeg" to "image/jpeg", "png" to "image/png", "webp" to "image/webp", "pdf" to "application/pdf", "docx" to "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "xlsx" to "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
}
