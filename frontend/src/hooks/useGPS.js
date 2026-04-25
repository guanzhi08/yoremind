import { useEffect, useRef } from "react";
import client from "../api/client";
import { isLoggedIn } from "../store/auth";

const POLL_INTERVAL_MS = 30 * 1000;

// ── Notification helper ──────────────────────────────────────────────────────

async function sendNotification(title, body) {
  // Capacitor native path
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

  // Web path: SW showNotification with 2s timeout, fallback to direct API
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

// ── Capacitor native GPS path ────────────────────────────────────────────────

async function startCapacitorGPS() {
  const { BackgroundGeolocation } = await import("@capacitor-community/background-geolocation");
  const { LocalNotifications } = await import("@capacitor/local-notifications");

  await LocalNotifications.requestPermissions();

  await BackgroundGeolocation.addWatcher(
    {
      backgroundMessage: "YoRemind 正在追蹤位置以觸發提醒",
      backgroundTitle: "YoRemind",
      requestPermissions: true,
      stale: false,
      distanceFilter: 30,
    },
    async (position, error) => {
      if (error || !position) return;
      if (!isLoggedIn()) return;
      const { latitude: lat, longitude: lng } = position;
      try {
        const { data: tasks } = await client.get("/tasks/check-trigger", { params: { lat, lng } });
        for (const task of tasks) {
          window.dispatchEvent(new CustomEvent("yoremind:alarm", { detail: task }));
          await LocalNotifications.schedule({
            notifications: [{
              id: task.id,
              title: "📍 YoRemind — " + task.title,
              body: "你已進入目標範圍！",
              schedule: { at: new Date(Date.now() + 500) },
              sound: task.notif_sound !== false ? "default" : null,
              vibrate: task.notif_vibrate !== false,
              importance: 5,
              visibility: 1,
              channelId: "yoremind_alerts",
              actionTypeId: "",
              extra: { taskId: task.id },
            }],
          });
        }
      } catch { /* ignore offline / auth errors */ }
    },
  );
}

// ── Web GPS path ─────────────────────────────────────────────────────────────

function startWebGPS() {
  if (!navigator.geolocation) return () => {};

  const posRef = { current: null };
  const firstFixRef = { current: true };
  let timer = null;

  const checkTrigger = async () => {
    const pos = posRef.current;
    if (!pos) return;
    try {
      const { data: tasks } = await client.get("/tasks/check-trigger", {
        params: { lat: pos.lat, lng: pos.lng },
      });
      for (const task of tasks) {
        window.dispatchEvent(new CustomEvent("yoremind:alarm", { detail: task }));
        await sendNotification(`YoRemind：${task.title}`, "你已抵達提醒地點！");
      }
    } catch { /* ignore */ }
  };

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      posRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (firstFixRef.current) {
        firstFixRef.current = false;
        checkTrigger();
      }
    },
    (err) => console.warn("[GPS] error:", err.message),
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
  );

  timer = setInterval(checkTrigger, POLL_INTERVAL_MS);

  return () => {
    navigator.geolocation.clearWatch(watchId);
    clearInterval(timer);
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGPS() {
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) return;

    if (window.Capacitor?.isNativePlatform()) {
      startCapacitorGPS().catch((e) => console.warn("[GPS] Capacitor start failed:", e));
      // BackgroundGeolocation manages its own lifecycle; no JS cleanup needed
    } else {
      cleanupRef.current = startWebGPS();
    }

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);
}
