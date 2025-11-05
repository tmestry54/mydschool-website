import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sectionAPI } from "../services/api";

interface FormData {
  section: string;
  startTime: string;
  endTime: string;
}

interface SavedSection {
  id: number;
  section_name: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

interface SectionOption {
  value: string;
  label: string;
  color: string;
}

export default function Sections() {
  const [formData, setFormData] = useState<FormData>({
    section: '',
    startTime: '',
    endTime: ''
  });
  
  const [savedSections, setSavedSections] = useState<SavedSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      navigate("/login");
      return;
    }
    
    fetchSections();
  }, [navigate]);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      const result = await sectionAPI.getAllSections();
      console.log('Fetched sections:', result);
      
      if (result.success) {
        setSavedSections(result.sections || []);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to load sections' });
        setSavedSections([]);
      }
    } catch (error: any) {
      console.error('Fetch sections error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to fetch sections' });
      setSavedSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Replace your handleSave function with this fixed version:

const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setMessage({ type: '', text: '' });

  if (!formData.section || !formData.startTime || !formData.endTime) {
    setMessage({ type: 'error', text: 'Please fill in all required fields (Section, Start Time, End Time)' });
    setIsLoading(false);
    return;
  }

  if (formData.startTime >= formData.endTime) {
    setMessage({ type: 'error', text: 'End time must be after start time' });
    setIsLoading(false);
    return;
  }

  try {
    console.log('Submitting form data:', formData);
    
    // ✅ FIX: Send data with correct field names that backend expects
    const payload = {
      section_name: formData.section,  // Backend expects 'section_name'
      start_time: formData.startTime,  // Backend expects 'start_time'
      end_time: formData.endTime       // Backend expects 'end_time'
    };
    
    console.log('Sending payload to backend:', payload);
    const result = await sectionAPI.addSection(payload);
    console.log('Add section result:', result);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Section saved successfully!' });
      setFormData({ section: '', startTime: '', endTime: '' });
      await fetchSections();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to save section' });
    }
  } catch (error: any) {
    console.error('Save section error:', error);
    setMessage({ type: 'error', text: error.message || 'Failed to save section' });
  } finally {
    setIsLoading(false);
  }
};
  const sectionOptions: SectionOption[] = [
    { value: 'KG', label: 'Kindergarten', color: 'from-pink-500 to-rose-500' },
    { value: 'Primary', label: 'Primary School', color: 'from-blue-500 to-cyan-500' },
    { value: 'Secondary', label: 'Secondary School', color: 'from-green-500 to-emerald-500' }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen flex flex-col">
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
                { name: 'Classes', path: '/classes' },
                { name: "Assignments", path: '/assignments' },
                { name: 'Profile', path: '/profile' },
                { name: 'Notifications', path: '/notifications' }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    item.path === '/sections'
                      ? 'bg-white bg-opacity-20 text-white font-semibold shadow-lg' 
                      : 'hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              ))}
              <button 
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-white/10 hover:bg-red-600 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12">
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p>{message.text}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100 h-fit">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Section & Timings
              </h2>
              <p className="text-gray-600">Configure school sections and their schedules</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Select Section *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {sectionOptions.map((section) => (
                    <label key={section.value} className="relative cursor-pointer">
                      <input 
                        type="radio" 
                        name="section" 
                        value={section.value}
                        checked={formData.section === section.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.section === section.value 
                          ? `bg-gradient-to-r ${section.color} text-white border-transparent shadow-lg` 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{section.label}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.section === section.value 
                              ? 'border-white bg-white bg-opacity-20' 
                              : 'border-gray-300'
                          }`}>
                            {formData.section === section.value && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input 
                    type="time" 
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input 
                    type="time" 
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ section: '', startTime: '', endTime: '' });
                    setMessage({ type: '', text: '' });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                  disabled={isLoading}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Saving...
                    </div>
                  ) : 'Save Section'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Saved Sections ({savedSections.length})
              </h3>
              <button
                onClick={fetchSections}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading sections...</p>
              </div>
            ) : savedSections.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No sections saved yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first section to get started</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {savedSections.map((section) => {
                  const sectionInfo = sectionOptions.find(opt => opt.value === section.section_name);
                  return (
                    <div key={section.id} className={`p-4 rounded-xl bg-gradient-to-r ${sectionInfo?.color || 'from-gray-500 to-gray-600'} text-white shadow-lg`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">{sectionInfo?.label || section.section_name}</h4>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete ${section.section_name} section?`)) {
                              return;
                            }
                            
                            try {
                              setIsLoading(true);
                              const result = await sectionAPI.deleteSection(section.id);
                              if (result.success) {
                                setMessage({ type: 'success', text: 'Section deleted successfully!' });
                                await fetchSections();
                                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                              } else {
                                setMessage({ type: 'error', text: result.message || 'Failed to delete section' });
                              }
                            } catch (error: any) {
                              setMessage({ type: 'error', text: error.message || 'Failed to delete section' });
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="p-1.5 bg-white/20 hover:bg-red-600 rounded-lg transition-colors"
                          title="Delete section"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-1 text-sm opacity-90">
                        <p><span className="font-medium">Time:</span> {section.start_time} - {section.end_time}</p>
                        <p className="text-xs opacity-75">Created: {new Date(section.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 text-center py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm">© 2025 MyDSchool Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}