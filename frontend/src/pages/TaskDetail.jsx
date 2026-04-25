import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import client from "../api/client";

// Fix Vite bundler breaking Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CIRCLE_STYLE = { color: "#3B82F6", fillColor: "#BFDBFE", fillOpacity: 0.3, weight: 2 };
const CURRENT_STYLE = { radius: 9, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.85, weight: 2 };
const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function fmtDist(m) {
  return m < 1000 ? `距目標 ${Math.round(m)} 公尺` : `距目標 ${(m / 1000).toFixed(1)} 公里`;
}

function fmtType(t) {
  return t === "checklist" ? "地點清單" : "地點提醒";
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    client.get(`/tasks/${id}`)
      .then(({ data }) => setTask(data))
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Initialize map after task loads
  useEffect(() => {
    if (!task || !mapRef.current || mapInstanceRef.current) return;

    const center = task.lat && task.lng ? [task.lat, task.lng] : [25.0478, 121.5319];
    const map = L.map(mapRef.current).setView(center, 15);
    L.tileLayer(OSM_TILE, { attribution: OSM_ATTR, maxZoom: 19 }).addTo(map);
    mapInstanceRef.current = map;

    if (task.lat && task.lng) {
      const targetLL = L.latLng(task.lat, task.lng);
      L.marker(targetLL).addTo(map);
      const circle = L.circle(targetLL, { radius: task.radius_m, ...CIRCLE_STYLE }).addTo(map);
      map.fitBounds(circle.getBounds(), { padding: [20, 20] });

      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const curLL = L.latLng(pos.coords.latitude, pos.coords.longitude);
          L.circleMarker(curLL, CURRENT_STYLE).addTo(map);
          const dist = targetLL.distanceTo(curLL);
          setDistance(dist);
          const bounds = circle.getBounds().extend(curLL);
          map.fitBounds(bounds, { padding: [40, 40] });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [task]);

  const toggleItem = async (itemId, current) => {
    const { data } = await client.patch(`/tasks/${id}/items/${itemId}`, { is_checked: !current });
    setTask((prev) => ({ ...prev, items: prev.items.map((it) => it.id === itemId ? data : it) }));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const { data } = await client.post(`/tasks/${id}/items`, { label: newLabel.trim() });
    setTask((prev) => ({ ...prev, items: [...prev.items, data] }));
    setNewLabel("");
  };

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const { data } = await client.patch(`/tasks/${id}`, { is_active: !task.is_active });
      setTask((prev) => ({ ...prev, is_active: data.is_active }));
    } finally {
      setToggling(false);
    }
  };

  const handleToggleNotif = async (key) => {
    const next = !task[key];
    const { data } = await client.patch(`/tasks/${id}`, { [key]: next });
    setTask((prev) => ({ ...prev, [key]: data[key] }));
  };

  const handleDelete = async () => {
    if (!window.confirm(`確定刪除「${task.title}」？`)) return;
    setDeleting(true);
    try {
      await client.delete(`/tasks/${id}`);
      navigate("/");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div style={styles.center}>載入中…</div>;
  if (!task) return <div style={styles.center}>找不到任務</div>;

  const checkedCount = task.items?.filter((i) => i.is_checked).length ?? 0;
  const totalCount = task.items?.length ?? 0;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.back}>← 返回</button>
        <span style={styles.headerTitle}>{task.title}</span>
      </header>

      {/* Info block */}
      <div style={styles.infoCard}>
        <div style={styles.infoRow}>
          <span style={{ ...styles.badge, background: task.type === "checklist" ? "#dbeafe" : "#ede9fe", color: task.type === "checklist" ? "#2563eb" : "#7c3aed" }}>
            {fmtType(task.type)}
          </span>
          <span style={{ ...styles.statusBadge, background: task.is_active ? "#d1fae5" : "#f1f5f9", color: task.is_active ? "#059669" : "#94a3b8" }}>
            {task.is_active ? "啟用中" : "已停用"}
          </span>
        </div>
        {(task.time_start || task.time_end) && (
          <div style={styles.infoMeta}>⏰ 觸發時間：{task.time_start || "—"} ~ {task.time_end || "—"}</div>
        )}
        {task.lat && task.lng && (
          <div style={styles.infoMeta}>📍 {task.lat.toFixed(5)}, {task.lng.toFixed(5)}</div>
        )}
        <div style={styles.infoMeta}>觸發半徑：{task.radius_m} 公尺</div>
        {task.type === "checklist" && totalCount > 0 && (
          <div style={{ ...styles.infoMeta, color: "#6366f1", fontWeight: 600 }}>清單進度：{checkedCount}/{totalCount}</div>
        )}
      </div>

      {/* Map block */}
      {task.lat && task.lng && (
        <div style={styles.mapSection}>
          <div ref={mapRef} style={styles.map} />
          {distance !== null && (
            <div style={styles.distBanner}>{fmtDist(distance)}</div>
          )}
          <div style={styles.mapLegend}>
            <span style={styles.legendBlue}>● 目標</span>
            <span style={styles.legendRed}>● 目前位置</span>
          </div>
        </div>
      )}

      {/* Checklist block */}
      {task.type === "checklist" && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>清單項目</div>
          {task.items.length === 0 && <p style={styles.empty}>尚無項目</p>}
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
        </div>
      )}

      {/* Notification settings */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>通知設定</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "notif_sound", icon: "🔔", label: "音效" },
            { key: "notif_vibrate", icon: "📳", label: "震動" },
            { key: "notif_lights", icon: "💡", label: "LED" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => handleToggleNotif(key)}
              style={{
                flex: 1, padding: "10px 4px", borderRadius: 10,
                border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer",
                ...(task[key] !== false
                  ? { background: "#ede9fe", borderColor: "#6366f1", color: "#6366f1" }
                  : { background: "#f8fafc", borderColor: "#cbd5e1", color: "#94a3b8" }),
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={styles.actions}>
        <button style={{ ...styles.actionBtn, background: task.is_active ? "#f1f5f9" : "#d1fae5", color: task.is_active ? "#64748b" : "#059669" }} onClick={handleToggleActive} disabled={toggling}>
          {task.is_active ? "停用提醒" : "啟用提醒"}
        </button>
        <button style={{ ...styles.actionBtn, background: "#fee2e2", color: "#ef4444" }} onClick={handleDelete} disabled={deleting}>
          {deleting ? "刪除中…" : "刪除"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f9fafb", paddingBottom: 40 },
  center: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#64748b" },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "#6366f1", color: "#fff" },
  back: { background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", flexShrink: 0 },
  headerTitle: { fontSize: 17, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  infoCard: { margin: 16, background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 6 },
  infoRow: { display: "flex", gap: 8, marginBottom: 4 },
  badge: { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 },
  statusBadge: { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 },
  infoMeta: { color: "#475569", fontSize: 13 },
  mapSection: { margin: "0 16px 16px", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", background: "#fff" },
  map: { height: 300, width: "100%" },
  distBanner: { padding: "8px 14px", background: "#eff6ff", color: "#1d4ed8", fontSize: 13, fontWeight: 600, borderTop: "1px solid #dbeafe" },
  mapLegend: { display: "flex", gap: 16, padding: "6px 14px", fontSize: 12, color: "#64748b", borderTop: "1px solid #f1f5f9" },
  legendBlue: { color: "#3B82F6", fontWeight: 600 },
  legendRed: { color: "#ef4444", fontWeight: 600 },
  section: { margin: "0 16px 16px", background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  sectionTitle: { fontWeight: 600, fontSize: 15, marginBottom: 12, color: "#1e293b" },
  empty: { color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "8px 0" },
  item: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: "#fff", background: "transparent" },
  checked: { background: "#6366f1", borderColor: "#6366f1" },
  addForm: { display: "flex", gap: 8, marginTop: 14 },
  addInput: { flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 15 },
  addBtn: { padding: "10px 20px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 20, cursor: "pointer" },
  actions: { margin: "0 16px", display: "flex", gap: 10 },
  actionBtn: { flex: 1, padding: "13px 0", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" },
};
