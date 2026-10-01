# Unity WebGL for Twini Twin City

Place the exported Unity WebGL build files in `unity/Build/` and name the build `TwinVillage` so the loader can find:

- `TwinVillage.loader.js`
- `TwinVillage.data`
- `TwinVillage.framework.js`
- `TwinVillage.wasm`

If the build uses another name or directory, set `window.TWINI_UNITY_CONFIG` in `index.html` before `unity-webgl.js` loads. The defaults are in `unity-webgl.js`.

## Web-to-Unity messages

The browser calls `TwiniWebBridge.OnWebMessage(string json)` on a Unity GameObject named `TwiniWebBridge`. Messages have a `type` and `payload`, for example:

```json
{"type":"villageState","payload":{"zone":"Twin Village","city":"Jakarta","completedMissions":["TV-001"]}}
```

A minimal receiver in Unity:

```csharp
using UnityEngine;

public class TwiniWebBridge : MonoBehaviour
{
    public void OnWebMessage(string json)
    {
        Debug.Log($"Message from Twini web: {json}");
    }
}
```

Keep the GameObject name and method name aligned with `bridgeObject` and `bridgeMethod` in the web configuration.

## Unity-to-web messages

Call the JavaScript bridge from a WebGL-only `.jslib` plugin. The browser dispatches a `twini-unity-message` event with `{ type, payload }` in `event.detail`.

```javascript
mergeInto(LibraryManager.library, {
  TwiniSendToWeb: function (typePtr, payloadPtr) {
    const type = UTF8ToString(typePtr);
    const payload = JSON.parse(UTF8ToString(payloadPtr));
    if (window.TwiniUnityBridge) window.TwiniUnityBridge.receive(type, payload);
  }
});
```

The web app responds to `requestVillageState` with the current village snapshot. Other incoming messages are informational and do not modify player progress automatically.
