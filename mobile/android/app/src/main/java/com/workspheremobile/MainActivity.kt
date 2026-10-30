package com.workspheremobile

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.bridge.Promise
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

class MainActivity : ReactActivity() {
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
