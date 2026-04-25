import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { clearAuth, getUser } from "../store/auth";
import TaskCard from "../components/TaskCard";
import BottomNav from "../components/BottomNav";
import { haversine } from "../utils/geo";

// ── Notification banner ──────────────────────────────────────────────────────

function NotificationBanner() {
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "unsupported"
  );
  if (permission === "unsupported" || permission === "granted") return null;
  if (permission === "denied") {
    return (
      <div style={bannerStyles.denied}>
        通知已被封鎖，請至瀏覽器設定手動開啟通知權限
      </div>
    );
  }
  return (
    <button style={bannerStyles.btn} onClick={async () => {
      const r = await Notification.requestPermission();
      setPermission(r);
    }}>
      🔔 點此啟用提醒通知
    </button>
  );
}

const bannerStyles = {
  btn: { display: "block", width: "100%", padding: "12px 16px", background: "#eff6ff", border: "none", borderBottom: "1px solid #bfdbfe", color: "#1d4ed8", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left" },
  denied: { padding: "10px 16px", background: "#fff7ed", borderBottom: "1px solid #fed7aa", color: "#c2410c", fontSize: 13 },
};

// ── Diagnostic panel ─────────────────────────────────────────────────────────

function DiagPanel() {
  const [gps, setGps] = useState({ lat: null, lng: null, status: "取得中…" });
  const [swStatus, setSwStatus] = useState("檢查中…");
  const [lastCheck, setLastCheck] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const watchRef = useRef(null);

  // Check SW status once on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator)) { setSwStatus("不支援"); return; }
    const tid = setTimeout(() => setSwStatus("逾時（未安裝？）"), 5000);
    navigator.serviceWorker.ready.then((reg) => {
      clearTimeout(tid);
      setSwStatus(`已就緒 scope=${reg.scope}`);
    }).catch((e) => {
      clearTimeout(tid);
      setSwStatus("失敗: " + e.message);
    });
  }, []);

  // Continuous GPS watch for display
  useEffect(() => {
    if (!navigator.geolocation) { setGps({ lat: null, lng: null, status: "不支援" }); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: "正常" }),
      (err) => setGps((p) => ({ ...p, status: "失敗: " + err.message })),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const manualTest = async () => {
    const perm = "Notification" in window ? Notification.permission : "unsupported";
    if (perm !== "granted") { alert("通知未授權: " + perm); return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("YoRemind 測試", { body: "如果你看到這則，通知系統正常！", icon: "/favicon.ico" });
      alert("SW 通知已發送，請查看通知列");
    } catch (e) {
      alert("SW 通知失敗: " + e.message + "\n嘗試直接通知…");
      try {
        new Notification("YoRemind 測試", { body: "直接通知測試" });
        alert("直接通知已發送");
      } catch (e2) {
        alert("全部失敗: " + e2.message);
      }
    }
  };

  const manualCheck = async () => {
    // Use already-acquired GPS position if available, otherwise get fresh fix
    let lat, lng;
    if (gps.lat !== null) {
      lat = gps.lat; lng = gps.lng;
    } else {
      if (!navigator.geolocation) { alert("GPS 不支援"); return; }
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
        );
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch (e) { alert("GPS 取得失敗: " + e.message); return; }
    }
    try {
      const { data: tasks } = await client.get("/tasks/check-trigger", { params: { lat, lng } });
      const time = new Date().toLocaleTimeString("zh-TW");
      setLastCheck(time);
      setLastResult(tasks);
      const names = tasks.map((t) => t.title).join("、") || "（無符合任務）";
      alert(`位置: ${lat.toFixed(5)}, ${lng.toFixed(5)}\n台灣時間: ${time}\n符合任務: ${tasks.length} 筆\n${names}`);
    } catch (e) {
      alert("check-trigger 失敗: " + e.message);
    }
  };

  const notifPerm = "Notification" in window ? Notification.permission : "不支援";

  return (
    <div style={diagStyles.panel}>
      <div style={diagStyles.title}>🔧 診斷面板</div>
      <div>📍 GPS: {gps.lat ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : "—"} <span style={diagStyles.tag}>{gps.status}</span></div>
      <div>🔔 通知權限: <span style={{ color: notifPerm === "granted" ? "#0f0" : "#f66" }}>{notifPerm}</span></div>
      <div>⚙️ Service Worker: {swStatus}</div>
      <div>🎯 上次 check: {lastCheck || "未執行"}</div>
      <div>📋 符合任務: {lastResult === null ? "—" : `${lastResult.length} 筆${lastResult.length ? "（" + lastResult.map((t) => t.title).join("、") + "）" : ""}`}</div>
      <div style={diagStyles.btnRow}>
        <button style={diagStyles.btn} onClick={manualTest}>手動測試通知</button>
        <button style={diagStyles.btn} onClick={manualCheck}>立即觸發檢查</button>
      </div>
    </div>
  );
}

const diagStyles = {
  panel: { background: "#1a1a1a", color: "#0f0", padding: "12px 16px", fontSize: 12, fontFamily: "monospace", lineHeight: 1.8 },
  title: { fontWeight: 700, marginBottom: 4, color: "#0ff" },
  tag: { color: "#aaa", marginLeft: 4 },
  btnRow: { display: "flex", gap: 8, marginTop: 8 },
  btn: { padding: "6px 12px", background: "#333", color: "#0f0", border: "1px solid #0f0", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "monospace" },
};

// ── Home page ────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [tab, setTab] = useState("tasks");
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const user = getUser();

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    Promise.all([client.get("/tasks"), client.get("/parcels")])
      .then(([t, p]) => { setTasks(t.data); setParcels(p.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  const handleDelete = async (id) => {
    if (!window.confirm("確定刪除？")) return;
    await client.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteParcel = async (id) => {
    if (!window.confirm("確定刪除？")) return;
    await client.delete(`/parcels/${id}`);
    setParcels((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.logo}>YoRemind</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>登出</button>
      </header>

      <NotificationBanner />

      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === "tasks" ? styles.activeTab : {}) }} onClick={() => setTab("tasks")}>提醒 ({tasks.length})</button>
        <button style={{ ...styles.tab, ...(tab === "parcels" ? styles.activeTab : {}) }} onClick={() => setTab("parcels")}>取貨 ({parcels.length})</button>
      </div>

      <div style={styles.content}>
        {loading && <p style={styles.hint}>載入中…</p>}

        {!loading && tab === "tasks" && (
          <>
            {tasks.length === 0 && <p style={styles.hint}>還沒有提醒，點下方 + 新增</p>}
            {tasks.map((task) => {
              let distance = null;
              if (userPos && task.lat && task.lng) {
                distance = haversine(userPos.lat, userPos.lng, task.lat, task.lng);
              }
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  distance={distance}
                  inRange={distance !== null && distance <= task.radius_m}
                />
              );
            })}
          </>
        )}

        {!loading && tab === "parcels" && (
          <>
            {parcels.length === 0 && <p style={styles.hint}>還沒有取貨提醒</p>}
            {parcels.map((p) => (
              <div key={p.id} style={styles.parcelCard}>
                <div style={styles.parcelName}>{p.store_name}</div>
                <div style={styles.parcelMeta}>取貨碼：{p.pickup_code || "—"} ｜ 狀態：{p.status}</div>
                <button style={styles.deleteBtn} onClick={() => handleDeleteParcel(p.id)}>刪除</button>
              </div>
            ))}
          </>
        )}
      </div>

      <DiagPanel />
      <BottomNav onAddTask={() => navigate("/add-task")} onAddParcel={() => navigate("/add-parcel")} />
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f9fafb", paddingBottom: 80 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#6366f1", color: "#fff" },
  logo: { fontSize: 20, fontWeight: 700 },
  logoutBtn: { background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "6px 12px", borderRadius: 8, cursor: "pointer" },
  tabs: { display: "flex", background: "#fff", borderBottom: "1px solid #e2e8f0" },
  tab: { flex: 1, padding: "12px 0", border: "none", background: "none", fontSize: 15, color: "#64748b", cursor: "pointer" },
  activeTab: { color: "#6366f1", borderBottom: "2px solid #6366f1", fontWeight: 600 },
  content: { padding: "16px 16px 0" },
  hint: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
  parcelCard: { background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "relative" },
  parcelName: { fontWeight: 600, fontSize: 16, marginBottom: 4 },
  parcelMeta: { color: "#64748b", fontSize: 13 },
  deleteBtn: { position: "absolute", top: 12, right: 12, background: "#fee2e2", border: "none", color: "#ef4444", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
};
