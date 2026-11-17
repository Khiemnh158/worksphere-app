package com.workspheremobile

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Small Android bridge. Credentials and attendance remain in the shared API layer. */
class WorkplaceDeviceModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "WorkplaceDevice"

    @ReactMethod
    fun scanQr(promise: Promise) {
        val activity = reactApplicationContext.currentActivity as? MainActivity
        if (activity == null) { promise.reject("NO_ACTIVITY", "Không mở được camera lúc này."); return }
        activity.runOnUiThread { activity.scanAttendanceQr(promise) }
    }
}
