package com.twinkicity.twinki_city_mobile

import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
	override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
		super.configureFlutterEngine(flutterEngine)

		MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.twinkicity/game_save")
			.setMethodCallHandler { call, result ->
				val preferences = getSharedPreferences("twinki_city", MODE_PRIVATE)
				when (call.method) {
					"load" -> result.success(preferences.getString("game_state", null))
					"save" -> {
						val state = call.arguments as? String
						if (state == null) {
							result.error("invalid_save", "Save data must be JSON text", null)
						} else {
							result.success(preferences.edit().putString("game_state", state).commit())
						}
					}
					else -> result.notImplemented()
				}
			}
	}
}
