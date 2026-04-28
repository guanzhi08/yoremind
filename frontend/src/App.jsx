import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { isLoggedIn } from "./store/auth";
import { useGPS } from "./hooks/useGPS";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AddTask from "./pages/AddTask";
import AddParcel from "./pages/AddParcel";
import TaskDetail from "./pages/TaskDetail";
import Settings from "./pages/Settings";
import AlarmModal from "./components/AlarmModal";
import PermissionWizard, { shouldShowWizard } from "./components/PermissionWizard";

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  useGPS();
  const [alarmQueue, setAlarmQueue] = useState([]);
  const [showWizard, setShowWizard] = useState(
    () => Capacitor.isNativePlatform() && shouldShowWizard()
  );

  useEffect(() => {
    const handler = (e) => setAlarmQueue((q) => [...q, e.detail]);
    window.addEventListener("yoremind:alarm", handler);
    return () => window.removeEventListener("yoremind:alarm", handler);
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/add-task" element={<PrivateRoute><AddTask /></PrivateRoute>} />
          <Route path="/add-parcel" element={<PrivateRoute><AddParcel /></PrivateRoute>} />
          <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {alarmQueue.length > 0 && (
        <AlarmModal
          task={alarmQueue[0]}
          onDismiss={() => setAlarmQueue((q) => q.slice(1))}
        />
      )}
      {showWizard && (
        <PermissionWizard onDone={() => setShowWizard(false)} />
      )}
    </>
  );
}
