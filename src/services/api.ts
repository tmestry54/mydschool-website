import axios from 'axios';

// ✅ CORRECT: Get API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:3001/api';

console.log('🌐 API Base URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ✅ FIX: Centralized file URL function that handles all cases
export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // If it's already a full URL, return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  // Ensure filePath starts with /
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  
  return `${baseUrl}${normalizedPath}`;
};

export const authAPI = {
  login: async (username: string, password: string) => {
    try {
      console.log('🔐 Calling API:', `${API_BASE_URL}/login`);
      const response = await apiClient.post('/login', { username, password });
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        throw error.response.data;
      } else if (error.request) {
        throw { success: false, message: 'Network error - server not responding' };
      } else {
        throw { success: false, message: 'Request failed' };
      }
    }
  }
};

export const adminAPI = {
  getStudents: async () => {
    try {
      const response = await apiClient.get('/admin/students');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching students:', error);
      throw { success: false, message: error.response?.data?.message || 'Failed to fetch students' };
    }
  },

  getStudentsByClass: async (classId: string) => {
    try {
      if (!classId) {
        throw { success: false, message: 'Class ID is required' };
      }
      const response = await apiClient.get(`/admin/students/class/${classId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching students by class:', error);
      throw { success: false, message: error.response?.data?.message || 'Failed to fetch students for this class' };
    }
  },
     
  addStudent: async (studentData: FormData) => {
    try {
      const response = await apiClient.post('/admin/students', studentData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding student:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to add student' };
    }
  },

  deleteStudent: async (studentId: number) => {
    try {
      if (!studentId) {
        throw { success: false, message: 'Student ID is required' };
      }
      const response = await apiClient.delete(`/admin/students/${studentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting student:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to delete student' };
    }
  },
 
  bulkUploadStudents: async (excelFile: File) => {
    try {
      if (!excelFile) {
        throw { success: false, message: 'Excel file is required' };
      }
      const formData = new FormData();
      formData.append('excelFile', excelFile);
      const response = await apiClient.post('/admin/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in bulk upload:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to upload students' };
    }
  },

  bulkUploadWithZip: async (zipFile: File) => {
    try {
      if (!zipFile) {
        throw { success: false, message: 'ZIP file is required' };
      }
      const formData = new FormData();
      formData.append('zipFile', zipFile);
      const response = await apiClient.post('/admin/students/bulk-upload-zip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error in ZIP upload:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to upload ZIP file' };
    }
  }
};
  
export const sectionAPI = {
  getAllSections: async () => {
    try {
      const response = await apiClient.get('/admin/sections');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching sections:', error);
      throw { success: false, message: error.response?.data?.message || 'Failed to fetch sections' };
    }
  },
  
  addSection: async (sectionData: any) => {
    try {
      if (!sectionData.section_name || !sectionData.start_time || !sectionData.end_time) {
        throw { success: false, message: 'Section name, start time, and end time are required' };
      }
      const response = await apiClient.post('/admin/sections', sectionData);
      return response.data;
    } catch (error: any) {
      console.error('Error adding section:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to add section' };
    }
  },

  deleteSection: async (sectionId: number) => {
    try {
      if (!sectionId) {
        throw { success: false, message: 'Section ID is required' };
      }
      const response = await apiClient.delete(`/admin/sections/${sectionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting section:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to delete section' };
    }
  }
};

export const classAPI = {
  getAllClasses: async () => {
    try {
      const response = await apiClient.get('/admin/classes');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      throw { success: false, message: error.response?.data?.message || 'Failed to fetch classes' };
    }
  },

  getAllSections: async () => {
    try {
      const response = await apiClient.get('/admin/sections');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching sections:', error);
      throw { success: false, message: error.response?.data?.message || 'Failed to fetch sections' };
    }
  },
  
  addClass: async (classData: any) => {
    try {
      if (!classData.class_name || !classData.section_id || !classData.teacher_name) {
        throw { success: false, message: 'Class name, section, and teacher name are required' };
      }
      const response = await apiClient.post('/admin/classes', classData);
      return response.data;
    } catch (error: any) {
      console.error('Error adding class:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to add class' };
    }
  },

  deleteClass: async (classId: number) => {
    try {
      if (!classId) {
        throw { success: false, message: 'Class ID is required' };
      }
      const response = await apiClient.delete(`/admin/classes/${classId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting class:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to delete class' };
    }
  }
};

export const assignmentAPI = {
  getAllAssignments: async () => {
    try {
      const response = await apiClient.get('/admin/assignments');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      throw { success: false, message: error.response?.data?.message || 'Failed to fetch assignments' };
    }
  },
  
  createAssignment: async (assignmentData: FormData) => {
    try {
      const response = await apiClient.post('/admin/assignments', assignmentData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to create assignment' };
    }
  },

  updateAssignment: async (assignmentId: number, assignmentData: FormData) => {
    try {
      if (!assignmentId) {
        throw { success: false, message: 'Assignment ID is required' };
      }
      const response = await apiClient.put(`/admin/assignments/${assignmentId}`, assignmentData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to update assignment' };
    }
  },

  deleteAssignment: async (assignmentId: number) => {
    try {
      if (!assignmentId) {
        throw { success: false, message: 'Assignment ID is required' };
      }
      const response = await apiClient.delete(`/admin/assignments/${assignmentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to delete assignment' };
    }
  }
};

export const notificationAPI = {
  getAllNotifications: async () => {
    try {
      const response = await apiClient.get('/admin/notifications');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw { success: false, message: error.response?.data?.message || 'Failed to fetch notifications' };
    }
  },
     
  createNotification: async (notificationData: FormData) => {
    try {
      const response = await apiClient.post('/admin/notifications', notificationData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating notification:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to create notification' };
    }
  },

  updateNotification: async (notificationId: number, notificationData: FormData) => {
    try {
      if (!notificationId) {
        throw { success: false, message: 'Notification ID is required' };
      }
      const response = await apiClient.put(`/admin/notifications/${notificationId}`, notificationData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating notification:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to update notification' };
    }
  },
     
  markAsRead: async (id: number) => {
    try {
      if (!id) {
        throw { success: false, message: 'Notification ID is required' };
      }
      const response = await apiClient.put(`/admin/notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to mark notification as read' };
    }
  },

  deleteNotification: async (notificationId: number) => {
    try {
      if (!notificationId) {
        throw { success: false, message: 'Notification ID is required' };
      }
      const response = await apiClient.delete(`/admin/notifications/${notificationId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to delete notification' };
    }
  }
};

export const profileAPI = {
  getProfile: async (userId: string | number) => {
    try {
      if (!userId) {
        throw { success: false, message: 'User ID is required' };
      }
      const response = await apiClient.get(`/student/profile/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to fetch profile' };
    }
  },
     
  updateProfile: async (userId: string | number, profileData: FormData) => {
    try {
      if (!userId) {
        throw { success: false, message: 'User ID is required' };
      }
      const response = await apiClient.put(`/student/profile/${userId}`, profileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to update profile' };
    }
  }
};

export const apiUtils = {
  testConnection: async () => {
    try {
      const response = await apiClient.get('/test');
      return response.data;
    } catch (error) {
      console.error('Server connection test failed:', error);
      return { success: false, message: 'Server is not reachable' };
    }
  },

  uploadFile: async (endpoint: string, file: File, additionalData?: Record<string, any>) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }
      const response = await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to upload file' };
    }
  }
};