import { useState, useEffect } from "react";
import AlarmPlugin from "../plugins/AlarmPlugin";

const STORAGE_KEY = "yoremind_permissions_done";

// Check if wizard already completed
export function shouldShowWizard() {
  return !localStorage.getItem(STORAGE_KEY);
}

export function markWizardDone() {
  localStorage.setItem(STORAGE_KEY, "1");
}

const STEPS = [
  {
    key: "notifications",
    icon: "🔔",
    title: "通知權限",
    desc: "YoRemind 需要傳送提醒通知。請在下一步中點選「允許」。",
    btnLabel: "授予通知權限",
    skipLabel: "稍後再說",
  },
  {
    key: "location",
    icon: "📍",
    title: "位置權限",
    desc: "需要精確位置才能在進入範圍時觸發提醒。請在系統對話框中選擇「使用 App 期間允許」。",
    btnLabel: "授予位置權限",
    skipLabel: "稍後再說",
  },
  {
    key: "backgroundLocation",
    icon: "🗺️",
    title: "背景位置權限",
    desc: "App 關閉或息屏時仍需追蹤位置。請在設定中將位置權限改為「一律允許」。",
    note: "設定 → 應用程式 → YoRemind → 權限 → 位置 → 一律允許",
    btnLabel: "開啟位置設定",
    skipLabel: "跳過",
    opensSettings: true,
  },
  {
    key: "fullScreenIntent",
    icon: "🚨",
    title: "全螢幕提醒權限",
    desc: "Android 14+ 需要額外授權才能在鎖定畫面顯示全螢幕提醒。",
    note: "請在設定中開啟「允許全螢幕意圖」",
    btnLabel: "開啟設定",
    skipLabel: "跳過",
    opensSettings: true,
    android14Only: true,
  },
];

export default function PermissionWizard({ onDone }) {
  const [step, setStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Build step list — only include fullScreenIntent if actually needed
    AlarmPlugin.checkFullScreenPermission()
      .then(({ granted }) => {
        const list = STEPS.filter((s) => !s.android14Only || !granted);
        setSteps(list);
      })
      .catch(() => setSteps(STEPS.filter((s) => !s.android14Only)));
  }, []);

  if (!steps.length) return null;
  if (step >= steps.length) {
    markWizardDone();
    onDone();
    return null;
  }

  const current = steps[step];
  const advance = () => setStep((s) => s + 1);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (current.key === "notifications") {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        await LocalNotifications.requestPermissions().catch(() => {});
      } else if (current.key === "location") {
        await new Promise((res) =>
          navigator.geolocation.getCurrentPosition(res, res, { timeout: 5000 })
        ).catch(() => {});
      } else if (current.key === "backgroundLocation") {
        // Can only guide user — open App info page
        const { App } = await import("@capacitor/app").catch(() => ({ App: null }));
        if (App) {
          await App.openUrl({ url: "package:com.yoremind.app" }).catch(() => {});
        }
      } else if (current.key === "fullScreenIntent") {
        await AlarmPlugin.requestFullScreenPermission().catch(() => {});
      }
    } catch { /* ignore */ }
    setLoading(false);
    advance();
  };

  const total = steps.length;
  const progress = ((step + 1) / total) * 100;

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        {/* Progress bar */}
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
        <div style={s.stepLabel}>{step + 1} / {total}</div>

        {/* Icon + content */}
        <div style={s.icon}>{current.icon}</div>
        <div style={s.title}>{current.title}</div>
        <div style={s.desc}>{current.desc}</div>
        {current.note && <div style={s.note}>{current.note}</div>}

        {/* Buttons */}
        <button style={s.primaryBtn} onClick={handleAction} disabled={loading}>
          {loading ? "請稍候…" : current.btnLabel}
        </button>
        <button style={s.skipBtn} onClick={advance}>
          {current.skipLabel}
        </button>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 10000, padding: 20,
  },
  card: {
    background: "#fff", borderRadius: 20, padding: "28px 24px 20px",
    maxWidth: 360, width: "100%", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 0,
  },
  progressTrack: {
    width: "100%", height: 4, background: "#e2e8f0", borderRadius: 2, marginBottom: 8,
  },
  progressFill: {
    height: "100%", background: "#6366f1", borderRadius: 2,
    transition: "width 0.3s ease",
  },
  stepLabel: { fontSize: 12, color: "#94a3b8", alignSelf: "flex-end", marginBottom: 20 },
  icon: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 10, textAlign: "center" },
  desc: { fontSize: 14, color: "#475569", textAlign: "center", lineHeight: 1.6, marginBottom: 8 },
  note: {
    fontSize: 12, color: "#6366f1", background: "#ede9fe",
    borderRadius: 8, padding: "8px 12px", textAlign: "center",
    lineHeight: 1.5, marginBottom: 16, width: "100%", boxSizing: "border-box",
  },
  primaryBtn: {
    marginTop: 20, width: "100%", padding: "14px 0",
    background: "#6366f1", color: "#fff", border: "none",
    borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer",
  },
  skipBtn: {
    marginTop: 10, width: "100%", padding: "10px 0",
    background: "none", color: "#94a3b8", border: "none",
    fontSize: 14, cursor: "pointer",
  },
};
