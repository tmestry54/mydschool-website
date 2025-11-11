/*import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceAPI, apiClient } from "../services/api"; // ✅ Add getFileUrl


interface Attendance {
  id: number;
  class_id: number;
  title: string;
  description: string;
  file_path?: string;
  class_name: string;
  section_name: string;
  created_at: string;
}


interface Class {
  id: number;
  class_name: string;
  section_name: string;
  teacher_name: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  roll_number: string;
  class_id: number;
}


export default function Assignments() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [formData, setFormData] = useState<AssignmentForm>({
    class_id: "",
    title: "",
    description: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      navigate("/login");
      return;
    }
    loadClasses();
    loadAssignments();
  }, [navigate]);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      const response = await classAPI.getAllClasses();
      if (response.success) {
        setClasses(response.classes || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load classes' });
      }
    } catch (error: any) {
      console.error('Error loading classes:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load classes' });
    } finally {
      setIsLoading(false);
    }
  };



  // View Mode
  if (viewMode && viewAttendance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-xl border-b-4 border-blue-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold">SP</span>
                </div>
                <h1 className="text-2xl font-bold tracking-wide">MyDschool Portal</h1>
              </div>
              <nav className="flex items-center space-x-1">
                {[
                  { name: "Dashboard", path: "/dashboard" },
                  { name: "Sections", path: "/sections" },
                  { name: "Classes", path: "/classes" },
                  { name: "Assignments", path: "/assignments" },
                  { name: "Profile", path: "/profile" },
                  { name: "Notifications", path: "/notifications" }
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${item.path === '/assignments'
                      ? 'bg-white bg-opacity-20 text-white font-semibold shadow-lg'
                      : 'hover:bg-white hover:bg-opacity-10 hover:text-white'
                      }`}
                  >
                    {item.name}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 bg-white/10 hover:bg-red-600 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </header>

*/