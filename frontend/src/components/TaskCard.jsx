export default function TaskCard({ task, onClick, onDelete }) {
  const checkedCount = task.items?.filter((i) => i.is_checked).length ?? 0;
  const totalCount = task.items?.length ?? 0;

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.left}>
        <span style={{ ...styles.badge, background: task.type === "checklist" ? "#dbeafe" : "#ede9fe", color: task.type === "checklist" ? "#2563eb" : "#7c3aed" }}>
          {task.type === "checklist" ? "清單" : "提醒"}
        </span>
        <div style={styles.title}>{task.title}</div>
        {task.lat && (
          <div style={styles.meta}>
            📍 {task.lat.toFixed(4)}, {task.lng.toFixed(4)} · {task.radius_m}m
          </div>
        )}
        {task.time_start && (
          <div style={styles.meta}>⏰ {task.time_start} – {task.time_end}</div>
        )}
        {task.type === "checklist" && totalCount > 0 && (
          <div style={styles.progress}>{checkedCount}/{totalCount} 完成</div>
        )}
      </div>
      <div style={styles.right}>
        <span style={{ ...styles.dot, background: task.is_active ? "#10b981" : "#cbd5e1" }} />
        <button
          style={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" },
  left: { flex: 1 },
  badge: { display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, marginBottom: 6 },
  title: { fontWeight: 600, fontSize: 16, color: "#1e293b", marginBottom: 4 },
  meta: { color: "#64748b", fontSize: 12, marginTop: 2 },
  progress: { marginTop: 6, fontSize: 12, color: "#6366f1", fontWeight: 600 },
  right: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, paddingLeft: 8 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  deleteBtn: { background: "none", border: "none", color: "#cbd5e1", fontSize: 16, cursor: "pointer", padding: 2 },
};
