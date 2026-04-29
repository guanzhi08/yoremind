import { useEffect, useRef } from "react";
import client from "../api/client";
import { isLoggedIn } from "../store/auth";
import AlarmPlugin from "../plugins/AlarmPlugin";

const POLL_INTERVAL_MS = 30 * 1000;
const GPS_STALE_MS = 90 * 1000;    // restart watcher if no position for 90s
const CHECK_COOLDOWN_MS = 8 * 1000; // ignore duplicate positions within 8s

// ── Global debug state ────────────────────────────────────────────────────────

window.__gpsDebug = {
  isNative: false,
  watcherStarted: false,
  watcherId: null,
  lastGpsTime: null,
  lastGpsTs: null,
  lastGpsCoords: null,
  lastAutoCheckTime: null,
  lastAutoCheckCount: null,
  errors: [],
  heartbeats: 0,
  restarts: 0,
  path: "init",
};

function dbg(updates) {
  Object.assign(window.__gpsDebug, updates);
  window.dispatchEvent(new Event("yoremind:gps-debug"));
}

function dbgError(msg) {
  const ts = new Date().toLocaleTimeString("zh-TW");
  window.__gpsDebug.errors = [
    ...window.__gpsDebug.errors.slice(-4),
    `${ts} ${msg}`,
  ];
  window.dispatchEvent(new Event("yoremind:gps-debug"));
}

// ── Notification helper ───────────────────────────────────────────────────────

async function sendNotification(title, body) {
  if (window.Capacitor?.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 100000),
          title,
          body,
          schedule: { at: new Date(Date.now() + 300) },
        }],
      });
    } catch (e) {
      console.warn("[Notification] Capacitor LocalNotifications failed:", e);
    }
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, rej) => setTimeout(() => rej(new Error("SW timeout")), 2000)),
    ]);
    await reg.showNotification(title, { body, icon: "/favicon.ico" });
  } catch {
    try { new Notification(title, { body }); } catch { /* ignore */ }
  }
}

// ── Shared trigger logic ──────────────────────────────────────────────────────

let lastCheckTs = 0;

async function handlePosition(lat, lng, source) {
  const now = Date.now();
  if (now - lastCheckTs < CHECK_COOLDOWN_MS) return;
  lastCheckTs = now;

  dbg({
    lastGpsTime: new Date().toLocaleTimeString("zh-TW"),
    lastGpsTs: now,
    lastGpsCoords: { lat, lng },
    path: source,
  });

  if (!isLoggedIn()) return;

  try {
    const { data: tasks } = await client.get("/tasks/check-trigger", { params: { lat, lng } });
    dbg({
      lastAutoCheckTime: new Date().toLocaleTimeString("zh-TW"),
      lastAutoCheckCount: tasks.length,
    });

    const notifSettings = (() => {
      try { return JSON.parse(localStorage.getItem("yoremind_notif_settings") || "{}"); }
      catch { return {}; }
    })();
    const ringtone = notifSettings.ringtone || "alarm_default";

    for (const task of tasks) {
      window.dispatchEvent(new CustomEvent("yoremind:alarm", { detail: task }));
      try {
        await AlarmPlugin.triggerAlarm({ taskTitle: task.title, sound: ringtone });
      } catch (e) {
        console.warn("[AlarmPlugin] triggerAlarm failed:", e);
      }
      if (task.notif_sound !== false || task.notif_vibrate !== false) {
        try {
          const { LocalNotifications } = await import("@capacitor/local-notifications");
          await LocalNotifications.schedule({
            notifications: [{
              id: task.id,
              title: "📍 YoRemind — " + task.title,
              body: "你已進入目標範圍！",
              schedule: { at: new Date(Date.now() + 300) },
              sound: task.notif_sound !== false ? "default" : null,
              vibrate: task.notif_vibrate !== false,
              importance: 5,
              visibility: 1,
              channelId: "yoremind_alerts",
              actionTypeId: "",
              extra: { taskId: task.id },
            }],
          });
        } catch { /* ignore */ }
      }
    }
  } catch (e) {
    dbgError(`checkTrigger(${source}): ${e.message}`);
  }
}

// ── BackgroundGeolocation watcher ─────────────────────────────────────────────

let bgWatcherId = null;

async function startBgGeoWatcher() {
  try {
    const { BackgroundGeolocation } = await import("@capacitor-community/background-geolocation");

    // Remove stale watcher if any
    if (bgWatcherId) {
      try { await BackgroundGeolocation.removeWatcher({ id: bgWatcherId }); } catch {}
      bgWatcherId = null;
    }

    const id = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "YoRemind 正在追蹤位置以觸發提醒",
        backgroundTitle: "YoRemind",
        requestPermissions: true,
        stale: false,
        distanceFilter: 15,
      },
      async (position, error) => {
        if (error) {
          dbgError(`BgGeo: ${error.code ?? ""} ${error.message ?? JSON.stringify(error)}`);
          return;
        }
        if (!position) return;
        await handlePosition(position.latitude, position.longitude, "BgGeo");
      },
    );

    bgWatcherId = id;
    dbg({ watcherStarted: true, watcherId: id ?? "ok" });
  } catch (e) {
    dbgError(`startBgGeoWatcher: ${e.message}`);
    dbg({ watcherStarted: false, watcherId: null });
  }
}

// ── Foreground fallback (navigator.geolocation) ───────────────────────────────

function startForegroundFallback() {
  if (!navigator.geolocation) return () => {};

  const posRef = { current: null };
  let firstFix = true;

  const doCheck = async () => {
    if (!posRef.current) return;
    await handlePosition(posRef.current.lat, posRef.current.lng, "geo-fg");
  };

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      posRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (firstFix) { firstFix = false; doCheck(); }
    },
    (err) => dbgError(`geo-fg: ${err.message}`),
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
  );

  const timer = setInterval(doCheck, POLL_INTERVAL_MS);

  return () => {
    navigator.geolocation.clearWatch(watchId);
    clearInterval(timer);
  };
}

// ── Web GPS path ──────────────────────────────────────────────────────────────

function startWebGPS() {
  if (!navigator.geolocation) return () => {};

  const posRef = { current: null };
  let firstFix = true;

  const doCheck = async () => {
    if (!posRef.current) return;
    await handlePosition(posRef.current.lat, posRef.current.lng, "web");
  };

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      posRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (firstFix) { firstFix = false; doCheck(); }
    },
    (err) => {
      console.warn("[GPS] error:", err.message);
      dbgError(`web: ${err.message}`);
    },
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
  );

  const timer = setInterval(doCheck, POLL_INTERVAL_MS);

  return () => {
    navigator.geolocation.clearWatch(watchId);
    clearInterval(timer);
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGPS() {
  const cleanupRef = useRef(null);

  useEffect(() => {
    const isNative = window.Capacitor?.isNativePlatform() ?? false;
    dbg({ isNative });

    if (!isLoggedIn()) return;

    if (isNative) {
      // Primary: BackgroundGeolocation (works when screen off / app backgrounded)
      startBgGeoWatcher();

      // Fallback: navigator.geolocation (works when app is in foreground)
      const stopFg = startForegroundFallback();

      // Restart BgGeo when app comes back to foreground
      let appHandle = null;
      import("@capacitor/app").then(({ App: CapApp }) => {
        CapApp.addListener("appStateChange", ({ isActive }) => {
          if (isActive) {
            dbg({ restarts: (window.__gpsDebug?.restarts ?? 0) + 1 });
            startBgGeoWatcher();
          }
        }).then((h) => { appHandle = h; });
      }).catch((e) => dbgError(`App listener: ${e.message}`));

      // Heartbeat: every 30s check stale state, restart if no GPS in 90s
      const heartbeat = setInterval(() => {
        dbg({ heartbeats: (window.__gpsDebug?.heartbeats ?? 0) + 1 });
        const d = window.__gpsDebug;
        if (d.watcherStarted && d.lastGpsTs && Date.now() - d.lastGpsTs > GPS_STALE_MS) {
          dbgError("GPS stale — restarting watcher");
          dbg({ restarts: (d.restarts ?? 0) + 1 });
          startBgGeoWatcher();
        }
        // Also restart if watcher never started
        if (!d.watcherStarted && (d.heartbeats ?? 0) > 1) {
          startBgGeoWatcher();
        }
      }, 30000);

      return () => {
        clearInterval(heartbeat);
        stopFg();
        if (appHandle) appHandle.remove().catch(() => {});
      };
    } else {
      cleanupRef.current = startWebGPS();
      return () => { if (cleanupRef.current) cleanupRef.current(); };
    }
  }, []);
}
