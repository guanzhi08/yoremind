import { useState } from "react";
import { Capacitor } from "@capacitor/core";

const STORAGE_KEY = "yoremind_notif_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? JSON.parse(raw) : {};
    return { sound: s.sound !== false, vibrate: s.vibrate !== false, lights: s.lights !== false };
  } catch {
    return { sound: true, vibrate: true, lights: true };
  }
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const isNative = Capacitor.isNativePlatform();

  const toggle = (key) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveSettings(next);
      return next;
    });
  };

  const sendTest = async () => {
    if (isNative) {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 10000),
            title: "📍 YoRemind — 測試通知",
            body: "如果你看到這則，通知設定正常！",
            schedule: { at: new Date(Date.now() + 500) },
            sound: settings.sound ? "default" : null,
            vibrate: settings.vibrate,
            importance: 5,
            visibility: 1,
            channelId: "yoremind_alerts",
            actionTypeId: "",
          }],
        });
        alert("測試通知已發送，請查看通知列");
      } catch (e) {
        alert("發送失敗: " + e.message);
      }
    } else {
      if (!("Notification" in window) || Notification.permission !== "granted") {
        alert("通知未授權，請先在首頁啟用通知");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("YoRemind 測試", { body: "通知系統正常！", icon: "/favicon.ico" });
        alert("測試通知已發送");
      } catch (e) {
        alert("發送失敗: " + e.message);
      }
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.title}>⚙️ 通知設定</span>
      </header>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>提醒方式</div>

        <ToggleRow
          icon="🔔"
          label="音效提醒"
          desc="觸發時播放提示音"
          checked={settings.sound}
          onChange={() => toggle("sound")}
        />
        <ToggleRow
          icon="📳"
          label="震動提醒"
          desc="觸發時震動裝置"
          checked={settings.vibrate}
          onChange={() => toggle("vibrate")}
        />
        <ToggleRow
          icon="💡"
          label="LED 閃爍"
          desc="觸發時 LED 指示燈閃爍（部分裝置支援）"
          checked={settings.lights}
          onChange={() => toggle("lights")}
        />
      </div>

      <div style={styles.section}>
        <button style={styles.testBtn} onClick={sendTest}>
          🧪 發送測試通知
        </button>
        {!isNative && (
          <p style={styles.hint}>Web 模式：音效/震動/LED 設定僅在 Android App 生效</p>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, desc, checked, onChange }) {
  return (
    <div style={rowStyles.row}>
      <div style={rowStyles.left}>
        <span style={rowStyles.icon}>{icon}</span>
        <div>
          <div style={rowStyles.label}>{label}</div>
          <div style={rowStyles.desc}>{desc}</div>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        style={{ ...rowStyles.toggle, background: checked ? "#6366f1" : "#cbd5e1" }}
      >
        <span style={{ ...rowStyles.knob, transform: checked ? "translateX(20px)" : "translateX(2px)" }} />
      </button>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f9fafb", paddingBottom: 100 },
  header: { padding: "20px 20px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0" },
  title: { fontSize: 20, fontWeight: 700, color: "#1e293b" },
  section: { background: "#fff", margin: "16px 16px 0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  sectionTitle: { padding: "12px 16px 4px", fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  testBtn: { display: "block", width: "calc(100% - 32px)", margin: "12px 16px", padding: "14px 0", background: "#6366f1", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer" },
  hint: { padding: "0 16px 12px", fontSize: 12, color: "#94a3b8", textAlign: "center" },
};

const rowStyles = {
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderTop: "1px solid #f1f5f9" },
  left: { display: "flex", alignItems: "center", gap: 12 },
  icon: { fontSize: 22 },
  label: { fontSize: 15, fontWeight: 600, color: "#1e293b" },
  desc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 },
  knob: { position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s", display: "block" },
};
