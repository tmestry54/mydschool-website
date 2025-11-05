import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Section from "./pages/Section";
import Classes from "./pages/Classes";
import Assignment from "./pages/Assignment";
import Profile from "./pages/Profile";
import Notification from "./pages/Notification";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sections" element={<Section />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/assignments" element={<Assignment />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notification />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}