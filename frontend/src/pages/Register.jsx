import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";
import { setToken, setUser } from "../store/auth";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("密碼不一致");
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post("/auth/register", { email: form.email, password: form.password });
      setToken(data.access_token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "註冊失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>建立帳號</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} type="email" placeholder="電子郵件" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="密碼（至少 8 字元）" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
          <input style={styles.input} type="password" placeholder="確認密碼" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "註冊中…" : "註冊"}
          </button>
        </form>
        <p style={styles.link}>已有帳號？<Link to="/login">登入</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0ff", padding: 16 },
  card: { background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  title: { fontSize: 24, fontWeight: 700, color: "#6366f1", marginBottom: 24 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 16 },
  error: { color: "#ef4444", fontSize: 14 },
  btn: { padding: 14, borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" },
  link: { textAlign: "center", marginTop: 16, color: "#64748b", fontSize: 14 },
};
