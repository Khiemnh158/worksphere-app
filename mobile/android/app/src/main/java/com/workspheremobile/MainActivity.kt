package com.workspheremobile

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.bridge.Promise
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import android.app.Activity
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContracts

class MainActivity : ReactActivity() {
  private data class FileOperation(val store: WorkplaceFileStore, val epoch: Long, val promise: Promise, val id: String? = null)
  private var pickOperation: FileOperation? = null
  private var saveOperation: FileOperation? = null
  private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
    val op = pickOperation; pickOperation = null
    if (op != null) {
      val uri = result.data?.data
      if (result.resultCode != Activity.RESULT_OK || uri == null) op.promise.resolve(null)
      else op.store.task(op.promise) { op.store.importDocument(uri,op.epoch) }
    }
  }
  private val fileSaver = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
    val op = saveOperation; saveOperation = null
    if (op != null) {
      val uri = result.data?.data
      if (result.resultCode != Activity.RESULT_OK || uri == null) op.promise.resolve(false)
      else op.store.task(op.promise) { op.store.exportDocument(op.id!!,uri,op.epoch) }
    }
  }
  internal fun pickWorkplaceAttachment(store: WorkplaceFileStore, promise: Promise) {
    if (pickOperation != null || saveOperation != null) { promise.reject("FILE_BUSY","Bộ chọn tệp đang mở."); return }
    pickOperation = FileOperation(store,store.epoch,promise)
    try {
      filePicker.launch(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE); type="*/*"
        putExtra(Intent.EXTRA_MIME_TYPES,WorkplaceFileStore.MIME.values.distinct().toTypedArray())
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      })
    } catch (_: Exception) { pickOperation=null; promise.reject("FILE_PICK_FAILED","Không mở được bộ chọn tệp.") }
  }
  internal fun saveWorkplaceAttachment(store: WorkplaceFileStore, id: String, promise: Promise) {
    if (pickOperation != null || saveOperation != null) { promise.reject("FILE_BUSY","Bộ chọn tệp đang mở."); return }
    try {
      val entry=store.entry(id,store.epoch)
      saveOperation=FileOperation(store,store.epoch,promise,id)
      fileSaver.launch(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE); type=entry.mime; putExtra(Intent.EXTRA_TITLE,entry.name)
      })
    } catch (_: Exception) { saveOperation=null; promise.reject("FILE_SAVE_FAILED","Không mở được nơi lưu tệp.") }
  }
  private var scanPromise: Promise? = null
  private val scanner = registerForActivityResult(ScanContract()) { result ->
    scanPromise?.resolve(result.contents)
    scanPromise = null
  }

  fun scanAttendanceQr(promise: Promise) {
    if (scanPromise != null) { promise.reject("SCAN_BUSY", "Camera đang mở."); return }
    scanPromise = promise
    try {
      scanner.launch(ScanOptions().setDesiredBarcodeFormats(ScanOptions.QR_CODE)
        .setCaptureActivity(WorkplaceQrActivity::class.java)
        .setPrompt("Quét QR chấm công WorkSphere").setBeepEnabled(false).setOrientationLocked(true))
    } catch (e: Exception) { scanPromise = null; promise.reject("SCAN_FAILED", "Không mở được camera.") }
  }

  override fun onDestroy() {
    pickOperation?.promise?.reject("FILE_CLOSED","Bộ chọn tệp đã đóng. Hãy thử lại."); pickOperation=null
    saveOperation?.promise?.reject("FILE_CLOSED","Bộ chọn nơi lưu đã đóng. Hãy thử lại."); saveOperation=null
    scanPromise?.reject("SCAN_CLOSED", "Camera đã đóng. Hãy quét lại.")
    scanPromise = null
    super.onDestroy()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "WorkSphereMobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
