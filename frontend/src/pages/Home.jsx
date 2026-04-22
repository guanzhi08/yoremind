import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { clearAuth, getUser } from "../store/auth";
import TaskCard from "../components/TaskCard";
import BottomNav from "../components/BottomNav";

export default function Home() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [tab, setTab] = useState("tasks");
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    Promise.all([client.get("/tasks"), client.get("/parcels")])
      .then(([t, p]) => {
        setTasks(t.data);
        setParcels(p.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

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

      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === "tasks" ? styles.activeTab : {}) }} onClick={() => setTab("tasks")}>提醒 ({tasks.length})</button>
        <button style={{ ...styles.tab, ...(tab === "parcels" ? styles.activeTab : {}) }} onClick={() => setTab("parcels")}>取貨 ({parcels.length})</button>
      </div>

      <div style={styles.content}>
        {loading && <p style={styles.hint}>載入中…</p>}

        {!loading && tab === "tasks" && (
          <>
            {tasks.length === 0 && <p style={styles.hint}>還沒有提醒，點下方 + 新增</p>}
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onDelete={handleDelete} onClick={() => navigate(`/tasks/${task.id}`)} />
            ))}
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
