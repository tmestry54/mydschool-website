import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentAPI, classAPI } from "../services/api";

interface AssignmentForm {
  class_id: string;
  title: string;
  description: string;
}

interface Assignment {
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

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await assignmentAPI.getAllAssignments();
      if (response.success) {
        setAssignments(response.assignments || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load assignments' });
      }
    } catch (error: any) {
      console.error('Error loading assignments:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load assignments' });
    } finally {
      setIsLoading(false);
    }
  };



  const handleEdit = (assignment: Assignment) => {
    setIsEditMode(true);
    setEditingAssignmentId(assignment.id);
    setFormData({
      class_id: assignment.class_id.toString(),
      title: assignment.title,
      description: assignment.description || ""
    });
    setShowForm(true);
    setViewMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleViewDocument = (filePath: string) => {
    const fileUrl = `http://localhost:3001/${filePath}`;
    window.open(fileUrl, '_blank');
  };

  const handleDownloadDocument = (filePath: string, fileName: string) => {
    const fileUrl = `http://localhost:3001/${filePath}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'assignment.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.class_id || !formData.title) {
      setMessage({ type: 'error', text: 'Please fill in required fields (Class and Title)' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      const formDataToSend = new FormData();
      formDataToSend.append('class_id', formData.class_id);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);

      if (selectedFile) {
        formDataToSend.append('assignmentFile', selectedFile);
      }

      let result;
      if (isEditMode && editingAssignmentId) {
        result = await assignmentAPI.updateAssignment(editingAssignmentId, formDataToSend);
      } else {
        result = await assignmentAPI.createAssignment(formDataToSend);
      }

      if (result.success) {
        setMessage({ type: 'success', text: isEditMode ? 'Assignment updated successfully!' : 'Assignment created successfully!' });
        resetForm();
        await loadAssignments();
        window.dispatchEvent(new Event('assignmentDataUpdated'));
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save assignment' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save assignment' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      class_id: "",
      title: "",
      description: ""
    });
    setSelectedFile(null);
    setShowForm(false);
    setIsEditMode(false);
    setEditingAssignmentId(null);
  };

  const handleDelete = async (assignmentId: number, assignmentTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${assignmentTitle}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await assignmentAPI.deleteAssignment(assignmentId);

      if (result.success) {
        setMessage({ type: 'success', text: 'Assignment deleted successfully!' });
        await loadAssignments();

        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete assignment' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete assignment' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // View Mode
  if (viewMode && viewingAssignment) {
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
                  { name: "Dashboard", href: "/dashboard" },
                  { name: "Sections", href: "/sections" },
                  { name: "Classes", href: "/classes" },
                  { name: "Assignments", href: "/assignments", active: true },
                  { name: "Profile", href: "/profile" },
                  { name: "Notifications", href: "/notifications" }
                ].map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${item.active
                        ? 'bg-white bg-opacity-20 text-white font-semibold shadow-lg'
                        : 'hover:bg-white hover:bg-opacity-10 hover:text-white'
                      }`}
                  >
                    {item.name}
                  </a>
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

        <main className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => {
                setViewMode(false);
                setViewingAssignment(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Assignments</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(viewingAssignment)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => handleDelete(viewingAssignment.id, viewingAssignment.title)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <h1 className="text-3xl font-bold mb-3">{viewingAssignment.title}</h1>
              <div className="flex items-center space-x-4 text-blue-100">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {viewingAssignment.class_name} - {viewingAssignment.section_name}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created: {formatDate(viewingAssignment.created_at)}
                </span>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {viewingAssignment.description || 'No description provided'}
                  </p>
                </div>
              </div>

              {viewingAssignment.file_path && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Assignment File</p>
                        <p className="text-sm text-gray-600">PDF document attached</p>
                      </div>
                    </div>
                    <a
                      href={viewingAssignment.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Created on {formatDate(viewingAssignment.created_at)}
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-16 bg-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-6 py-8 text-center">
            <p className="text-gray-300">© 2025 MyDschool Portal. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Main Assignments View
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
                { name: "Dashboard", href: "/dashboard" },
                { name: "Sections", href: "/sections" },
                { name: "Classes", href: "/classes" },
                { name: "Assignments", href: "/assignments", active: true },
                { name: "Profile", href: "/profile" },
                { name: "Notifications", href: "/notifications" }
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${item.active
                      ? 'bg-white bg-opacity-20 text-white font-semibold shadow-lg'
                      : 'hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                >
                  {item.name}
                </a>
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

      <main className="max-w-7xl mx-auto p-8">
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p>{message.text}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Manage Assignments</h2>
          <button
            onClick={() => {
              if (showForm && !isEditMode) {
                resetForm();
              } else if (isEditMode) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className={`${showForm
                ? 'bg-gray-600 hover:bg-gray-700'
                : 'bg-blue-600 hover:bg-blue-700'
              } text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2`}
          >
            {showForm ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Assignment
              </>
            )}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
            <h3 className="text-xl font-bold mb-4">
              {isEditMode ? 'Edit Assignment' : 'Create New Assignment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class *</label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.class_name} - {classItem.section_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter assignment title"
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter description "
                  rows={4}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF File (Optional)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">Selected: {selectedFile.name}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {isEditMode ? 'Update Assignment' : 'Create Assignment'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold">All Assignments ({assignments.length})</h3>
          </div>

          {isLoading && !showForm ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading assignments...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left font-semibold">Class</th>
                    <th className="p-4 text-left font-semibold">Assignment Title</th>
                    <th className="p-4 text-left font-semibold">Created Date</th>
                    <th className="p-4 text-left font-semibold">File</th>
                    <th className="p-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">
                        {assignment.class_name} - {assignment.section_name}
                      </td>
                      <td className="p-4">{assignment.title}</td>
                      <td className="p-4">{formatDate(assignment.created_at)}</td>
                      <td className="p-4">
                        {assignment.file_path ? (
                          <span className="text-green-600 font-medium">PDF Attached</span>
                        ) : (
                          <span className="text-gray-500">No File</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDocument(assignment.file_path!)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View document"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(assignment.file_path!, `${assignment.title}.pdf`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download document"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors duration-200"
                            title="Edit assignment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id, assignment.title)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                            title="Delete assignment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No assignments created yet. Create your first assignment above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-300">© 2025 MyDschool Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}