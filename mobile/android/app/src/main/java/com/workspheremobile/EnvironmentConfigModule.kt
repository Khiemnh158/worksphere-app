package com.workspheremobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

/**
 * Exposes native compile-time environment configuration to React Native.
 * Reads BuildConfig.API_BASE_URL generated during the Gradle build.
 */
class EnvironmentConfigModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "EnvironmentConfig"

    override fun getConstants(): MutableMap<String, Any?> {
        return mutableMapOf(
            "API_BASE_URL" to BuildConfig.API_BASE_URL,
            "BUNDLED_LOCAL" to BuildConfig.BUNDLED_LOCAL
        )
    }
}
