import { useEffect, useRef, useState } from "react";

const ALARM_SOUND = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

export default function AlarmModal({ task, onDismiss }) {
  const audioRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const audio = new Audio(ALARM_SOUND);
    audio.loop = true;
    audio.play().catch(() => {});
    audioRef.current = audio;

    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);

    return () => {
      audio.pause();
      audio.src = "";
      clearInterval(timer);
    };
  }, [task.id]);

  const dismiss = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    onDismiss();
  };

  const fmtElapsed = (s) => s < 60 ? `${s} 秒` : `${Math.floor(s / 60)} 分 ${s % 60} 秒`;

  return (
    <div style={styles.overlay} onClick={(e) => e.stopPropagation()}>
      <div style={styles.card}>
        <div style={styles.iconRow}>
          <span style={styles.icon}>📍</span>
        </div>
        <div style={styles.subtitle}>已進入目標範圍</div>
        <div style={styles.taskTitle}>{task.title}</div>
        <div style={styles.elapsed}>已響鈴 {fmtElapsed(elapsed)}</div>
        <button style={styles.dismissBtn} onClick={dismiss}>
          ✅ 我知道了
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  card: {
    background: "#fff", borderRadius: 24, padding: "40px 32px",
    textAlign: "center", maxWidth: 320, width: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  iconRow: { fontSize: 56, lineHeight: 1 },
  icon: {},
  subtitle: { fontSize: 14, color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 },
  taskTitle: { fontSize: 24, fontWeight: 700, color: "#1e293b", lineHeight: 1.3 },
  elapsed: { fontSize: 13, color: "#94a3b8" },
  dismissBtn: {
    marginTop: 12, padding: "14px 40px", borderRadius: 16,
    border: "none", background: "#6366f1", color: "#fff",
    fontSize: 17, fontWeight: 700, cursor: "pointer", width: "100%",
  },
};
