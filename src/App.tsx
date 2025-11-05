import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Section from "./pages/Section";
import Profile from "./pages/Profile";
import Notification from "./pages/Notification";
import Class from "./pages/Classes";
import Assignment from "./pages/Assignment";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        
        {/* Main App Routes - FIXED: All routes use lowercase */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sections" element={<Section />} />
        <Route path="/classes" element={<Class />} />
        <Route path="/assignments" element={<Assignment />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notification />} />
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}