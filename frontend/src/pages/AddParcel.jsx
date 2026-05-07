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
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [mapAutoSearch, setMapAutoSearch] = useState("");

  const handleScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await client.post("/parcels/parse-screenshot", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 20000,
      });
      setForm((f) => ({
        ...f,
        store_name: data.store_name ?? f.store_name,
        pickup_code: data.pickup_code ?? f.pickup_code,
        expires_at: data.expires_at
          ? `${data.expires_at}T23:59`
          : f.expires_at,
      }));
      if (data.note) setNote(data.note);
      if (data.store_name) setMapAutoSearch(data.store_name);
    } catch (err) {
      setScanError(err.response?.data?.detail || "辨識失敗，請手動填寫");
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  };

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
        note: note || null,
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

        {/* 截圖辨識區塊 */}
        <div style={styles.screenshotBox}>
          <label htmlFor="ss-input" style={{
            ...styles.screenshotBtn,
            opacity: scanning ? 0.7 : 1,
            cursor: scanning ? "not-allowed" : "pointer",
          }}>
            {scanning ? "OCR 辨識中…" : "📷 上傳蝦皮截圖自動填表"}
          </label>
          <input
            id="ss-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleScreenshot}
            disabled={scanning}
          />
          {scanning && <p style={styles.scanHint}>OCR 辨識中，請稍候…</p>}
          {scanError && <p style={styles.scanError}>{scanError}</p>}
        </div>
        <div style={styles.divider}>── 或手動填寫 ──</div>

        <label style={styles.label}>門市名稱</label>
        <input style={styles.input} value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} placeholder="例：蝦皮店到店 新店百忍店" required />

        <label style={styles.label}>門市位置</label>
        <Map8Picker
          lat={form.store_lat}
          lng={form.store_lng}
          onSelect={({ lat, lng }) => setForm((f) => ({ ...f, store_lat: lat, store_lng: lng }))}
          autoSearch={mapAutoSearch}
        />
        {form.store_lat && <p style={styles.coords}>{form.store_lat.toFixed(6)}, {form.store_lng.toFixed(6)}</p>}

        <label style={styles.label}>取貨碼</label>
        <input style={styles.input} value={form.pickup_code} onChange={(e) => setForm({ ...form, pickup_code: e.target.value })} placeholder="取貨條碼或號碼" />

        <label style={styles.label}>聯絡電話</label>
        <input style={styles.input} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xx-xxxxxx" />

        <label style={styles.label}>商品備註</label>
        <input style={styles.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="商品描述（截圖自動填入或手動輸入）" />

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
  screenshotBox: { background: "#ede9fe", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, border: "2px dashed #6366f1" },
  screenshotBtn: { display: "block", textAlign: "center", padding: "12px 0", background: "#6366f1", color: "#fff", borderRadius: 10, fontWeight: 600, fontSize: 15 },
  scanHint: { color: "#6366f1", fontSize: 13, textAlign: "center", margin: 0 },
  scanError: { color: "#ef4444", fontSize: 13, margin: 0 },
  divider: { textAlign: "center", color: "#94a3b8", fontSize: 13, margin: "4px 0" },
};
