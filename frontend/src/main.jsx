import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import("@capacitor/core").then(({ Capacitor }) => {
  if (!Capacitor.isNativePlatform()) return;
  import("@capacitor/local-notifications").then(({ LocalNotifications }) => {
    LocalNotifications.createChannel({
      id: "yoremind_alerts",
      name: "YoRemind 提醒",
      description: "位置觸發的提醒通知",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true,
      lights: true,
      lightColor: "#6366f1",
    }).catch(() => {});
  });
}).catch(() => {});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then((reg) => console.log("SW registered:", reg.scope))
      .catch((err) => console.error("SW registration failed:", err));
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
