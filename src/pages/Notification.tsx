import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { classAPI, notificationAPI, adminAPI, getFileUrl } from "../services/api"; // ✅ Add getFileUrl


interface Notification {
  id: number;
  title: string;
  description: string;
  message?: string;
  created_at: string;
  type: string;
  is_read: boolean;
  class_name: string;
  class_id: number;
  file_path: string;
  recipient_type: 'all' | 'particular';  // Changed from 'entire'
  selected_students?: string[];
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

export default function Notifications() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<"main" | "single" | "all">("main");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [recipientType, setRecipientType] = useState<"all" | "particular">("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingNotificationId, setEditingNotificationId] = useState<number | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    message: string;
  }>({
    title: "",
    description: "",
    message: ""
  });

  const [classes, setClasses] = useState<Class[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
    loadNotifications();
  }, []);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadStudentsByClass(selectedClass);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const response = await classAPI.getAllClasses();
      setClasses(response.classes);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };
  const handleViewDocument = (filePath: string) => {
    const fileUrl = getFileUrl(filePath); // ✅ Use centralized function
    window.open(fileUrl, '_blank');
  };
  const handleDownloadDocument = (filePath: string, fileName: string) => {
    const fileUrl = getFileUrl(filePath); // ✅ Use centralized function
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'notification.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getAllNotifications();
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadStudentsByClass = async (classId: string) => {
    try {
      setLoading(true);
      const response = await adminAPI.getStudentsByClass(classId);
      if (response.success) {
        setStudents(response.students || []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const selectClass = (classId: string) => {
    setSelectedClass(classId);
    setIsClassDropdownOpen(false);
    // Reset student selection when changing class
    setSelectedStudents([]);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id.toString()));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setCurrentView("single");
    if (!notification.is_read) {
      markNotificationAsRead(notification.id);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleEdit = (notification: Notification) => {
    setIsEditMode(true);
    setEditingNotificationId(notification.id);
    setFormData({
      title: notification.title,
      description: notification.description,
      message: notification.message || ''
    });
    setSelectedClass(notification.class_id.toString());
    setRecipientType(notification.recipient_type);
    if (notification.selected_students) {
      setSelectedStudents(notification.selected_students);
    }
    setCurrentView("main");
  };

  const handleDelete = async (notificationId: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await notificationAPI.deleteNotification(notificationId);
      if (result.success) {
        alert('Notification deleted successfully!');
        await loadNotifications();
        setCurrentView("all");
      } else {
        alert('Failed to delete notification: ' + result.message);
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (type: "all" | "particular") => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (type === 'particular' && selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('class_id', selectedClass);
      formDataToSend.append('recipient_type', type);

      if (type === 'particular') {
        formDataToSend.append('selected_students', JSON.stringify(selectedStudents));
      }

      if (selectedFile) {
        formDataToSend.append('notificationFile', selectedFile);
      }

      let response;
      if (isEditMode && editingNotificationId) {
        response = await notificationAPI.updateNotification(editingNotificationId, formDataToSend);
      } else {
        response = await notificationAPI.createNotification(formDataToSend);
      }

      if (response.success) {
        alert(isEditMode ? 'Notification updated successfully!' : 'Notification sent successfully!');
        resetForm();
        await loadNotifications();
      } else {
        alert('Failed: ' + response.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save notification');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', message: '' });
    setSelectedClass('');
    setSelectedStudents([]);
    setSelectedFile(null);
    setRecipientType('all');
    setIsEditMode(false);
    setEditingNotificationId(null);
  };

  const handleBackClick = () => {
    setCurrentView("main");
    setSelectedNotification(null);
  };

  const handleViewAllClick = () => {
    setCurrentView("all");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Single Notification View
  if (currentView === "single" && selectedNotification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleBackClick}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(selectedNotification)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedNotification.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <h1 className="text-3xl font-bold text-white">{selectedNotification.title}</h1>
              <p className="text-indigo-100 mt-2">
                Class {selectedNotification.class_name} • {new Date(selectedNotification.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="p-8">
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">{selectedNotification.description}</p>
                {selectedNotification.message && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedNotification.message}</p>
                  </div>
                )}
                {selectedNotification.recipient_type === 'particular' && selectedNotification.selected_students && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Sent to specific students</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNotification.selected_students.map((studentId: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          Student ID: {studentId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // All Notifications View
  if (currentView === "all") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto p-8">
          <button
            onClick={handleBackClick}
            className="mb-6 flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Main</span>
          </button>

          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">All Notifications</h1>

          <div className="grid gap-6">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{notification.title}</h3>
                    <p className="text-gray-600 mb-3">{notification.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Class {notification.class_name}</span>
                      <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${notification.recipient_type === 'all' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                        }`}>
                        {notification.recipient_type === 'all' ? 'Entire Class' : 'Selected Students'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(notification);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View notification"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(notification);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit notification"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main Notifications View
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${item.path === '/notifications'
                      ? 'bg-white bg-opacity-20 text-white font-semibold shadow-lg'
                      : 'hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                >
                  {item.name}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-white/10 hover:bg-red-600 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-white"
              >
                Logout
              </button>
            </nav>         </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto p-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {isEditMode ? 'Edit Notification' : 'Notification Center'}
          </h2>
          <p className="text-gray-600 text-lg">
            {isEditMode ? 'Update notification details' : 'Send and manage notifications for your classes'}
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={handleViewAllClick}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            View All Notifications
          </button>
          {isEditMode && (
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM9 4h6l2 2v5l-2 2H9L7 11V6l2-2z" />
              </svg>
              {isEditMode ? 'Edit Notification' : 'Send New Notification'}
            </h3>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700">Select Class</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-gray-300"
                >
                  <div className="flex justify-between items-center">
                    <span className={selectedClass ? "text-gray-900" : "text-gray-500"}>
                      {selectedClass ?
                        `Class ${classes.find(c => c.id.toString() === selectedClass)?.class_name} - ${classes.find(c => c.id.toString() === selectedClass)?.section_name}` :
                        "Select a class"
                      }
                    </span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isClassDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isClassDropdownOpen && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-2 z-50 max-h-64 overflow-y-auto">
                    <div className="p-2">
                      {classes.map((classItem) => (
                        <button
                          key={classItem.id}
                          type="button"
                          onClick={() => selectClass(classItem.id.toString())}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-150 text-gray-700"
                        >
                          Class {classItem.class_name} - {classItem.section_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-700">Send To</label>
              <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="recipient"
                    value="all"
                    checked={recipientType === "all"}
                    onChange={(e) => setRecipientType(e.target.value as "all" | "particular")}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Entire Class</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="recipient"
                    value="particular"
                    checked={recipientType === "particular"}
                    onChange={(e) => setRecipientType(e.target.value as "all" | "particular")}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Particular Students</span>
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <input
                type="text"
                placeholder="Notification Title *"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
              <textarea
                placeholder="Notification Description *"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
              ></textarea>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach File (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 transition-colors duration-200"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            {selectedClass && (
              <div className={`rounded-2xl p-6 border ${recipientType === "all"
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                }`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-gray-800">
                    {recipientType === "all"
                      ? `All Students Will Receive (${students.length} students)`
                      : `Select Students ${selectedStudents.length > 0 ? `(${selectedStudents.length} selected)` : ''}`
                    }
                  </h4>
                  {recipientType === "particular" && (
                    <button
                      type="button"
                      onClick={toggleAllStudents}
                      disabled={loading || students.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500">Loading students...</p>
                  </div>
                ) : students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                    {students.map((student) => {
                      // For "Entire Class": all checked and disabled
                      // For "Particular Students": only checked if in selectedStudents array
                      const isChecked = recipientType === "all" || selectedStudents.includes(student.id.toString());
                      const isDisabled = recipientType === "all";

                      return (
                        <label
                          key={student.id}
                          className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${isDisabled
                            ? 'bg-blue-100 border-blue-300 cursor-not-allowed'
                            : isChecked
                              ? 'bg-green-100 border-green-400 cursor-pointer'
                              : 'bg-white border-gray-200 hover:border-green-400 hover:bg-green-50 cursor-pointer'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudentSelection(student.id.toString())}
                            disabled={isDisabled}
                            className={`w-5 h-5 rounded border-gray-300 ${isDisabled
                              ? 'text-blue-500 cursor-not-allowed opacity-70'
                              : 'text-green-600 focus:ring-green-500 cursor-pointer'
                              }`}
                          />
                          <div className="flex-1">
                            <span className={`font-medium block ${isDisabled ? 'text-blue-800' : 'text-gray-800'
                              }`}>
                              {student.first_name} {student.last_name}
                            </span>
                            <span className={`text-sm ${isDisabled ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                              Roll No: {student.roll_number}
                            </span>
                          </div>
                          {isDisabled && (
                            <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-medium">
                              ✓ Will receive
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>No students found in this class.</p>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => handleSubmit(recipientType)}
              disabled={loading}
              className={`w-full py-4 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : recipientType === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105'
                } text-white`}
            >
              {loading
                ? 'Processing...'
                : isEditMode
                  ? 'Update Notification'
                  : recipientType === 'all'
                    ? `Send to Entire Class (${students.length} students)`
                    : `Send to Selected Students (${selectedStudents.length})`
              }
            </button>
          </div>
        </div>

        <div className="mt-12 bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Recent Notifications</h3>
            <button
              onClick={handleViewAllClick}
              className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
            >
              View All →
            </button>
          </div>

          <div className="space-y-4">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-4 flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                  <div className={`w-3 h-3 rounded-full ${notification.is_read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                    <p className="text-sm text-gray-600">
                      Class {notification.class_name} • {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {notification.file_path && (
                  <div className="mt-4 flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Attachment</p>
                      <p className="text-sm text-gray-600">Document available</p>
                    </div>
                    <button
                      onClick={() => handleViewDocument(notification.file_path!)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(notification.file_path!, `${notification.title}.pdf`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </button>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(notification);
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(notification);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-lg font-medium">No notifications yet</p>
                <p className="text-sm mt-1">Create your first notification above</p>
              </div>
            )}
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