import React, { useEffect, useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
interface User {
  id: number;
  role: string;
  username: string;
}

interface Class {
  id: number;
  class_name: string;
  section_name?: string;
  teacher_name?: string;
}

export default function Profile() {
  const [formData, setFormData] = useState({
    class_id: '',
    first_name: '',
    last_name: '',
    roll_number: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    blood_group: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    photo: null as File | null,
    excelFile: null as File | null,
      zipFile: null as File | null  
  });

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      alert("Please log in first");
      window.location.href = "/";
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      console.log('Current user from localStorage:', userData);
      setUser(userData);

      loadClasses();

      if (userData.role === 'student') {
        loadStudentProfile(userData.id);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      alert("Invalid user session. Please log in again.");
      window.location.href = "/";
    }
  }, []);

  const loadClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/classes`);
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes);
      } else {
        console.error('Failed to load classes:', data.message);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudentProfile = async (userId: number) => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching profile for userId:', userId);

      const response = await fetch(`${API_BASE_URL}/api/student/profile/${userId}`);
      const data = await response.json();

      console.log('Profile API response:', data);

      if (data.success) {
        const profile = data.profile;
        
        let formattedDate = '';
        if (profile.date_of_birth) {
          formattedDate = profile.date_of_birth.split('T')[0];
        }

        console.log('Setting form data with profile:', profile);

        setFormData({
          class_id: profile.class_id?.toString() || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          roll_number: profile.roll_number || '',
          username: profile.username || '',
          password: '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          date_of_birth: formattedDate,
          blood_group: profile.blood_group || '',
          parent_name: profile.parent_name || '',
          parent_phone: profile.parent_phone || '',
          parent_email: profile.parent_email || '',
          photo: null,
          excelFile: null,
          zipFile :null
        });
        setIsEditing(true);
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, files } = target;

    setFormData((prev) => ({
      ...prev,
      [name]: files && files.length > 0 ? files[0] : value
    }));

    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!user) {
      setError('User session not found. Please log in again.');
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.username) {
      setError('Please fill in all required fields (First Name, Last Name, Username)');
      return;
    }

    if (!isEditing && !formData.password) {
      setError('Password is required for new students');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const submitData = new FormData();

      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof typeof formData];
        if (key === 'photo' && value instanceof File) {
          submitData.append('photo', value);
        } else if (key !== 'photo' && key !== 'excelFile' && value !== '') {
          submitData.append(key, String(value));
        }
      });

      let response;
      if (isEditing && user.role === 'student') {
        console.log('Updating profile for user:', user.id);
        response = await fetch(`${API_BASE_URL}/api/student/profile/${user.id}`, {
          method: 'PUT',
          body: submitData
        });
      } else {
        console.log('Creating new student');
        response = await fetch(`${API_BASE_URL}/api/admin/students`,{
          method: 'POST',
          body: submitData
        });
      }

      const data = await response.json();
      console.log('Save response:', data);

      if (data.success) {
        setSuccess(isEditing ? 'Profile updated successfully!' : 'Student added successfully!');

        if (!isEditing) {
          handleReset();
        } else if (user.role === 'student') {
          loadStudentProfile(user.id);
        }
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Error occurred while saving. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      class_id: '',
      first_name: '',
      last_name: '',
      roll_number: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      blood_group: '',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      photo: null,
      excelFile: null,
      zipFile :null
    });
    setError('');
    setSuccess('');
  };

  const handleBulkUpload = async () => {
    if (!formData.excelFile) {
      setError('Please select an Excel file first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const uploadData = new FormData();
      uploadData.append('excelFile', formData.excelFile);

      const response = await fetch(`${API_BASE_URL}/api/admin/students/bulk-upload`, {
        method: 'POST',
        body: uploadData
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully imported ${data.data.imported} students!`);
        if (data.data.failed > 0) {
          console.log('Import errors:', data.data.errorDetails);
        }

        setFormData(prev => ({ ...prev, excelFile: null }));
      } else {
        setError(data.message || 'Bulk upload failed');
      }
    } catch (error) {
      console.error('Error during bulk upload:', error);
      setError('Error occurred during upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };
const handleZipUpload = async () => {
  if (!formData.zipFile) {
    setError('Please select a ZIP file first');
    return;
  }

  try {
    setLoading(true);
    setError('');
    setSuccess('');

    const uploadData = new FormData();
    uploadData.append('zipFile', formData.zipFile);

    const response = await fetch(`${API_BASE_URL}/api/admin/students/bulk-upload-zip`,  {
      method: 'POST',
      body: uploadData
    });
const data = await response.json();

    if (data.success) {
      setSuccess(
        `Successfully imported ${data.data.imported} students! ` +
        `Photos uploaded: ${data.data.photosUploaded || 0}`
      );
      if (data.data.failed > 0) {
        console.log('Import errors:', data.data.errorDetails);
        setError(`${data.data.failed} students failed to import. Check console for details.`);
      }

      setFormData(prev => ({ ...prev, zipFile: null }));
    } else {
      setError(data.message || 'ZIP upload failed');
    }
  } catch (error) {
    console.error('Error during ZIP upload:', error);
    setError('Error occurred during ZIP upload. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const logout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    alert("Logged out successfully");
    window.location.href = "/";
  };

  if (loading && !error && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                { name: 'Profile', path: '/profile', active: true },
                { name: 'Notifications', path: '/notifications' }
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    item.active
                      ? 'bg-white bg-opacity-20 text-white font-semibold shadow-lg'
                      : 'hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }`}
                >
                  {item.name}
                </a>
              ))}
              <button
                onClick={logout}
                className="ml-4 px-4 py-2 bg-white/10 hover:bg-red-600 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white shadow-2xl rounded-3xl p-10 border border-gray-100">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              {isEditing ? 'Update Profile' : 'Student Profile'}
            </h2>
            <p className="text-gray-600 text-lg">
              {isEditing ? 'Update your personal information' : 'Add new student information'}
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-600 font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Class
                </label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  <option value="">Choose class...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name} {cls.section_name ? `- ${cls.section_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleInputChange}
                    placeholder="Enter roll number"
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleInputChange}
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Select blood group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    rows={3}
                    className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter username"
                      className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password {!isEditing && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                        className="w-full border-2 border-gray-300 rounded-xl p-4 pr-12 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {isEditing && (
                      <p className="mt-2 text-sm text-gray-500">
                        Leave blank to keep the current password unchanged
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Parent Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Parent Name
                    </label>
                    <input
                      type="text"
                      name="parent_name"
                      value={formData.parent_name}
                      onChange={handleInputChange}
                      placeholder="Enter parent name"
                      className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Parent Phone
                    </label>
                    <input
                      type="tel"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleInputChange}
                      placeholder="Enter parent phone"
                      className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Parent Email
                    </label>
                    <input
                      type="email"
                      name="parent_email"
                      value={formData.parent_email}
                      onChange={handleInputChange}
                      placeholder="Enter parent email"
                      className="w-full border-2 border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    name="photo"
                    onChange={handleInputChange}
                    accept="image/*"
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                {!isEditing && user?.role !== 'student' && (
  <>
    {/* Excel Only Upload */}
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        📄 Upload Excel Sheet Only (No Photos)
      </label>
      <input
        type="file"
        name="excelFile"
        onChange={handleInputChange}
        accept=".xls,.xlsx,.csv"
        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
      />
      {formData.excelFile && (
        <button
          type="button"
          onClick={handleBulkUpload}
          disabled={loading}
          className="mt-3 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all duration-200"
        >
          {loading ? 'Uploading...' : 'Upload Excel File'}
        </button>
      )}
    </div>

    {/* ZIP Upload with Photos */}
    <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
      <label className="block text-sm font-semibold text-blue-700 mb-2">
        Upload ZIP File (Excel + Photos)
      </label>
      <input
        type="file"
        name="zipFile"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setFormData(prev => ({ ...prev, zipFile: file }));
          }
        }}
        accept=".zip"
        className="w-full border-2 border-dashed border-blue-300 rounded-xl p-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
      />
      {formData.zipFile && (
        <button
          type="button"
          onClick={handleZipUpload}
          disabled={loading}
          className="mt-3 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
        >
          {loading ? 'Uploading ZIP...' : 'Upload ZIP with Photos'}
        </button>
      )}
      <p className="mt-2 text-xs text-blue-600">
        ZIP must contain: students.xlsx + photos folder
      </p>
    </div>
  </>
)}

                  
                
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 mt-12">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Profile' : 'Save Profile')}
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 text-center py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm">© 2025 School Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}