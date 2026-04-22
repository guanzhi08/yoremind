import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/tasks/${id}`).then(({ data }) => setTask(data)).finally(() => setLoading(false));
  }, [id]);

  const toggleItem = async (itemId, currentChecked) => {
    const { data } = await client.patch(`/tasks/${id}/items/${itemId}`, { is_checked: !currentChecked });
    setTask((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? data : it)),
    }));
  };

  const addItem = async (label) => {
    const { data } = await client.post(`/tasks/${id}/items`, { label });
    setTask((prev) => ({ ...prev, items: [...prev.items, data] }));
  };

  const [newLabel, setNewLabel] = useState("");

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    await addItem(newLabel.trim());
    setNewLabel("");
  };

  if (loading) return <div style={styles.loading}>載入中…</div>;
  if (!task) return <div style={styles.loading}>找不到任務</div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.back}>← 返回</button>
        <h2 style={styles.title}>{task.title}</h2>
      </header>

      <div style={styles.content}>
        <div style={styles.meta}>
          類型：{task.type === "checklist" ? "清單" : "提醒"} ｜
          位置：{task.lat ? `${task.lat.toFixed(4)}, ${task.lng.toFixed(4)}` : "未設定"} ｜
          半徑：{task.radius_m}m
        </div>

        {task.type === "checklist" && (
          <>
            <div style={styles.listTitle}>清單項目</div>
            {task.items.map((item) => (
              <div key={item.id} style={styles.item} onClick={() => toggleItem(item.id, item.is_checked)}>
                <span style={{ ...styles.checkbox, ...(item.is_checked ? styles.checked : {}) }}>
                  {item.is_checked ? "✓" : ""}
                </span>
                <span style={{ textDecoration: item.is_checked ? "line-through" : "none", color: item.is_checked ? "#94a3b8" : "#1e293b" }}>
                  {item.label}
                </span>
              </div>
            ))}
            <form onSubmit={handleAddItem} style={styles.addForm}>
              <input style={styles.addInput} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="新增項目…" />
              <button style={styles.addBtn} type="submit">+</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f9fafb" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#64748b" },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "#6366f1", color: "#fff" },
  back: { background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" },
  title: { fontSize: 18, fontWeight: 600 },
  content: { padding: 20 },
  meta: { color: "#64748b", fontSize: 13, marginBottom: 20, lineHeight: 1.6 },
  listTitle: { fontWeight: 600, fontSize: 16, marginBottom: 12, color: "#1e293b" },
  item: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: "#fff", background: "transparent" },
  checked: { background: "#6366f1", borderColor: "#6366f1" },
  addForm: { display: "flex", gap: 8, marginTop: 16 },
  addInput: { flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 15 },
  addBtn: { padding: "10px 20px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 20, cursor: "pointer" },
};
