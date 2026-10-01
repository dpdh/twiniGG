import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)

    let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "TwinkiGameSave")
    let channel = FlutterMethodChannel(
      name: "com.twinkicity/game_save",
      binaryMessenger: registrar.messenger()
    )
    channel.setMethodCallHandler { call, result in
      switch call.method {
      case "load":
        result(UserDefaults.standard.string(forKey: "twinki_game_state"))
      case "save":
        guard let state = call.arguments as? String else {
          result(FlutterError(code: "invalid_save", message: "Save data must be JSON text", details: nil))
          return
        }
        UserDefaults.standard.set(state, forKey: "twinki_game_state")
        result(true)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }
}
