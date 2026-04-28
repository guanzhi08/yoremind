import { registerPlugin } from "@capacitor/core";

const AlarmPlugin = registerPlugin("AlarmPlugin", {
  // Web stub — all methods are no-ops on web
  web: () => ({
    triggerAlarm: async () => ({}),
    checkFullScreenPermission: async () => ({ granted: true }),
    requestFullScreenPermission: async () => ({}),
  }),
});

export default AlarmPlugin;
