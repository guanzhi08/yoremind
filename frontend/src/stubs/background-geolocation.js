import { registerPlugin } from "@capacitor/core";

// On native (Android/iOS) the plugin is installed via the native bridge.
// On web/dev we fall back to no-ops so the rest of the app still loads.
export const BackgroundGeolocation =
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform()
    ? registerPlugin("BackgroundGeolocation")
    : {
        addWatcher: async () => () => {},
        removeWatcher: async () => {},
      };
