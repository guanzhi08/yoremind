import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isLoggedIn } from "./store/auth";
import { useGPS } from "./hooks/useGPS";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AddTask from "./pages/AddTask";
import AddParcel from "./pages/AddParcel";
import TaskDetail from "./pages/TaskDetail";

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  useGPS();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/add-task" element={<PrivateRoute><AddTask /></PrivateRoute>} />
        <Route path="/add-parcel" element={<PrivateRoute><AddParcel /></PrivateRoute>} />
        <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
