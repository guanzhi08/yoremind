import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav({ onAddTask, onAddParcel }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={styles.nav}>
      <button style={styles.btnTask} onClick={onAddTask}>
        <span style={styles.icon}>＋</span>
        <span>新增提醒</span>
      </button>
      <button style={styles.btnParcel} onClick={onAddParcel}>
        <span style={styles.icon}>📦</span>
        <span>取貨提醒</span>
      </button>
      <button
        style={{ ...styles.btnSettings, ...(pathname === "/settings" ? styles.btnSettingsActive : {}) }}
        onClick={() => navigate("/settings")}
      >
        <span style={styles.icon}>⚙️</span>
        <span>設定</span>
      </button>
    </nav>
  );
}

const styles = {
  nav: { position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", background: "#fff", borderTop: "1px solid #e2e8f0", padding: "8px 16px", gap: 12, zIndex: 100 },
  btnTask: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
  btnParcel: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", borderRadius: 12, border: "none", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
  btnSettings: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 0", borderRadius: 12, border: "none", background: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: 15, cursor: "pointer" },
  btnSettingsActive: { background: "#e0e7ff", color: "#6366f1" },
  icon: { fontSize: 18 },
};
