import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Map8Picker from "../components/Map8Picker";

export default function AddTask() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    type: "reminder",
    lat: null,
    lng: null,
    radius_m: 200,
    time_start: "",
    time_end: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        radius_m: Number(form.radius_m),
        time_start: form.time_start || null,
        time_end: form.time_end || null,
      };
      await client.post("/tasks", payload);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "儲存失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.back}>← 返回</button>
        <span style={styles.title}>新增提醒</span>
      </header>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>標題</label>
        <input style={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="提醒標題" required />

        <label style={styles.label}>類型</label>
        <select style={styles.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="reminder">地點提醒</option>
          <option value="checklist">地點清單</option>
        </select>

        <label style={styles.label}>觸發地點</label>
        <Map8Picker
          lat={form.lat}
          lng={form.lng}
          onSelect={({ lat, lng, radius }) => setForm((f) => ({ ...f, lat, lng, radius_m: radius }))}
        />
        {form.lat && <p style={styles.coords}>{form.lat.toFixed(6)}, {form.lng.toFixed(6)}</p>}

        <label style={styles.label}>時間範圍（可選）</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...styles.input, flex: 1 }} type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
          <span style={{ lineHeight: "44px", color: "#64748b" }}>—</span>
          <input style={{ ...styles.input, flex: 1 }} type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
        </div>

        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? "儲存中…" : "儲存提醒"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f9fafb" },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "#6366f1", color: "#fff" },
  back: { background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" },
  title: { fontSize: 18, fontWeight: 600 },
  form: { padding: 20, display: "flex", flexDirection: "column", gap: 8 },
  label: { fontWeight: 600, color: "#374151", fontSize: 14 },
  input: { padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 15, background: "#fff" },
  coords: { color: "#6366f1", fontSize: 13 },
  error: { color: "#ef4444", fontSize: 14 },
  btn: { marginTop: 8, padding: 14, borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" },
};
