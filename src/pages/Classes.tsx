import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// API service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const classAPI = {
  getAllClasses: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/classes`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch classes');
      }
      return data;
    } catch (error: any) {
      console.error('getAllClasses error:', error);
      throw { success: false, message: error.message || 'Failed to fetch classes' };
    }
  },

  addClass: async (classData: { class_name: string; section_id: number; teacher_name: string }) => {
    try {
      console.log('Sending class data:', classData);
      const response = await fetch(`${API_BASE_URL}/admin/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData),
      });
      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add class');
      }
      return data;
    } catch (error: any) {
      console.error('addClass error:', error);
      throw { success: false, message: error.message || 'Failed to add class' };
    }
  },

  getAllSections: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sections`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch sections');
      }
      return data;
    } catch (error: any) {
      console.error('getAllSections error:', error);
      throw { success: false, message: error.message || 'Failed to fetch sections' };
    }
  },

  deleteClass: async (classId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/classes/${classId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete class');
      }
      return data;
    } catch (error: any) {
      console.error('deleteClass error:', error);
      throw { success: false, message: error.message || 'Failed to delete class' };
    }
  },
};

interface FormData {
  classWithDivision: string;
  section_id: string;
  teacherName: string;
}

interface SavedClass {
  id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  teacher_name: string;
  created_at: string;
}

interface Section {
  id: number;
  section_name: string;
  start_time: string;
  end_time: string;
}

export default function Classes() {
  const [formData, setFormData] = useState<FormData>({
    classWithDivision: "",
    section_id: "",
    teacherName: ""
  });
  const [savedClasses, setSavedClasses] = useState<SavedClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem("currentUser");
    if (!user) {
      navigate("/login");
      return;
    }

    fetchSections();
    fetchClasses();
  }, [navigate]);

  const fetchSections = async () => {
    try {
      const result = await classAPI.getAllSections();
      if (result.success) {
        setSections(result.sections || []);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to load sections' });
      }
    } catch (error: any) {
      console.error('Fetch sections error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to fetch sections' });
    }
  };

  const fetchClasses = async () => {
    try {
      const result = await classAPI.getAllClasses();
      console.log('Fetched classes:', result);

      if (result.success) {
        setSavedClasses(result.classes || []);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to load classes' });
      }
    } catch (error: any) {
      console.error('Fetch classes error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to fetch classes' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.classWithDivision || !formData.section_id || !formData.teacherName) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      setIsLoading(false);
      return;
    }

    try {
      console.log('Submitting form data:', formData);

      const classData = {
        class_name: formData.classWithDivision,
        section_id: parseInt(formData.section_id),
        teacher_name: formData.teacherName
      };

      const result = await classAPI.addClass(classData);
      console.log('Add class result:', result);

      if (result.success) {
        setMessage({ type: 'success', text: 'Class added successfully!' });
        setFormData({ classWithDivision: "", section_id: "", teacherName: "" });

        // Refresh the classes list
        await fetchClasses();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to add class' });
      }
    } catch (error: any) {
      console.error('Save class error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to add class' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const getSectionColor = (sectionName: string) => {
    switch (sectionName) {
      case 'KG': return 'from-pink-500 to-rose-500';
      case 'Primary': return 'from-blue-500 to-cyan-500';
      case 'Secondary': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen flex flex-col">
      {/* Enhanced Header */}
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
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Sections', path: '/sections' },
                { name: 'Classes', path: '/classes', active: true },
                { name: "Assignments", path: '/assignments' },
                { name: 'Profile', path: '/profile' },
                { name: 'Notifications', path: '/notifications' }
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${item.active
                    ? 'bg-white bg-opacity-20 text-white font-semibold shadow-lg'
                    : 'hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                >
                  {item.name}
                </a>
              ))}           <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-white/10 hover:bg-red-600 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-white"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto p-8">
        {/* Status Message */}
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

        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 animate-fade-in">Class & Division Management</h2>
          <p className="text-gray-600 text-lg">Configure and manage your class divisions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Form Section */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Add New Class
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Class Name Input */}
              <div className="space-y-3">
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Class Name with Division *
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="classWithDivision"
                    value={formData.classWithDivision}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter class name (e.g., 1A, 2B, 10C)"
                    className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-lg group-hover:border-gray-300"
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>

              {/* Section Selection */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-700">
                  Select Section *
                </label>
                <select
                  name="section_id"
                  value={formData.section_id}
                  onChange={handleInputChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  <option value="">Select a section</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.section_name} ({section.start_time} - {section.end_time})
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Name */}
              <div className="space-y-3">
                <label className="block text-lg font-semibold text-gray-700">
                  Teacher Name *
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="teacherName"
                    value={formData.teacherName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-lg group-hover:border-gray-300"
                    placeholder="Enter teacher name"
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="relative z-10 flex items-center">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Adding Class...
                      </>
                    ) : (
                      <>
                        Save Class Configuration
                        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </form>
          </div>

          {/* Saved Classes Display */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  Saved Classes ({savedClasses.length})
                </h3>
                <button
                  onClick={fetchClasses}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading classes...</p>
                </div>
              ) : savedClasses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No classes created yet</p>
                  <p className="text-gray-400 text-sm mt-1">Add your first class to get started</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {savedClasses.map((savedClass) => (
                    <div key={savedClass.id} className={`p-4 rounded-xl bg-gradient-to-r ${getSectionColor(savedClass.section_name)} text-white shadow-lg`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">Class {savedClass.class_name}</h4>
                        <div className="flex space-x-1">
                          <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-medium">
                            {savedClass.section_name}
                          </span>
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to delete Class ${savedClass.class_name}? This cannot be undone if the class has no enrolled students.`)) {
                                return;
                              }

                              try {
                                setIsLoading(true);
                                setMessage({ type: '', text: '' });
                                const result = await classAPI.deleteClass(savedClass.id);
                                if (result.success) {
                                  setMessage({ type: 'success', text: 'Class deleted successfully!' });
                                  await fetchClasses();
                                  setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                                } else {
                                  setMessage({ type: 'error', text: result.message || 'Failed to delete class' });
                                }
                              } catch (error: any) {
                                setMessage({ type: 'error', text: error.message || 'Failed to delete class' });
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            className="p-1.5 bg-white/20 hover:bg-red-600 rounded-lg transition-colors ml-2"
                            title="Delete class"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm opacity-90">
                        <p><span className="font-medium">Teacher:</span> {savedClass.teacher_name}</p>
                        <p><span className="font-medium">Section:</span> {savedClass.section_name}</p>
                        <p className="text-xs opacity-75">Created: {new Date(savedClass.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative mt-16 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-gray-300">© 2025 MyDschool Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
