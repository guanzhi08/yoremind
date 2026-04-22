import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";
import { setToken, setUser } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await client.post("/auth/login", form);
      setToken(data.access_token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "登入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>YoRemind</h1>
        <p style={styles.subtitle}>時間 + 地點提醒 App</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="電子郵件"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="密碼"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "登入中…" : "登入"}
          </button>
        </form>
        <p style={styles.link}>
          還沒有帳號？<Link to="/register">立即註冊</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0ff", padding: 16 },
  card: { background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
  title: { fontSize: 28, fontWeight: 700, color: "#6366f1", marginBottom: 4 },
  subtitle: { color: "#64748b", marginBottom: 24 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 16, outline: "none" },
  error: { color: "#ef4444", fontSize: 14 },
  btn: { padding: "14px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" },
  link: { textAlign: "center", marginTop: 16, color: "#64748b", fontSize: 14 },
};
