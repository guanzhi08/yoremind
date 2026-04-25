import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Map8Picker from "../components/Map8Picker";

export default function AddParcel() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    store_name: "",
    store_lat: null,
    store_lng: null,
    pickup_code: "",
    phone: "",
    expires_at: "",
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
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        pickup_code: form.pickup_code || null,
        phone: form.phone || null,
      };
      await client.post("/parcels", payload);
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
        <span style={styles.title}>新增取貨提醒</span>
      </header>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>門市名稱</label>
        <input style={styles.input} value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} placeholder="例：7-11 忠孝門市" required />

        <label style={styles.label}>門市位置</label>
        <Map8Picker
          lat={form.store_lat}
          lng={form.store_lng}
          onSelect={({ lat, lng }) => setForm((f) => ({ ...f, store_lat: lat, store_lng: lng }))}
        />
        {form.store_lat && <p style={styles.coords}>{form.store_lat.toFixed(6)}, {form.store_lng.toFixed(6)}</p>}

        <label style={styles.label}>取貨碼</label>
        <input style={styles.input} value={form.pickup_code} onChange={(e) => setForm({ ...form, pickup_code: e.target.value })} placeholder="取貨條碼或號碼" />

        <label style={styles.label}>聯絡電話</label>
        <input style={styles.input} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xx-xxxxxx" />

        <label style={styles.label}>取件期限</label>
        <input style={styles.input} type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />

        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? "儲存中…" : "儲存取貨提醒"}
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
  btn: { marginTop: 8, padding: 14, borderRadius: 12, border: "none", background: "#10b981", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" },
};
