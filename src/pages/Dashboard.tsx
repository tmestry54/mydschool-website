import { useEffect, useState } from "react";
import Assignment from "./Assignment";
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
interface Birthday {
  id: number;
  name: string;
  class: string;
  age: number;
}

interface Assignment {
  id: number;
  class_id: number;
  title: string;
  description?: string;
  class_name: string;        // Change from 'class' to 'class_name'
  section_name?: string;
  file_path?: string;
  created_at?: string;
}
interface Activity {
  id: number;
  activity: string;
  time: string;
  type: string;
}

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeNotifications: number;
}

interface DashboardData {
  todaysBirthdays: Birthday[];
  stats: Stats;
  recentActivities: Activity[];
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  class_name?: string;
  date_of_birth?: string;
  created_at?: string;
}

interface Class {
  id: number;
  class_name: string;
  teacher_name?: string;
  section_name?: string;
}

interface Notification {
  id: number;
  title: string;
  is_read?: boolean;
  created_at?: string;
}

export default function FlexibleDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todaysBirthdays: [
      { id: 1, name: "Alice Johnson", class: "5A", age: 11 },
      { id: 2, name: "Michael Chen", class: "3B", age: 9 }
    ],
    
    stats: {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      activeNotifications: 0
    },
    recentActivities: [
      { id: 1, activity: "System initialized successfully", time: "Recently", type: "system" }
    ]
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const user = localStorage.getItem("currentUser");
    if (!user) {
      alert("Please log in first");
      return;
    }

    // Load initial data
    loadDashboardData();

    // Set up time update
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Listen for data updates
    const handleDataUpdate = () => {
      console.log('Refreshing dashboard data...');
      loadDashboardData();
    };

    window.addEventListener('studentDataUpdated', handleDataUpdate);
window.addEventListener('assignmentDataUpdated', handleDataUpdate); // ADD THIS LINE

    return () => {
      clearInterval(timer);
      window.removeEventListener('studentDataUpdated', handleDataUpdate);
   window.removeEventListener('assignmentDataUpdated', handleDataUpdate); // ADD THIS LINE
  };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to load real data from API, fallback to mock data if endpoints don't exist
      const responses = await Promise.allSettled([
     fetch(`${API_BASE_URL}/api/admin/students`),
     fetch(`${API_BASE_URL}/api/admin/classes`),
     fetch(`${API_BASE_URL}/api/admin/notifications`),
     fetch(`${API_BASE_URL}/api/admin/assignments`)]);

      let students: Student[] = [];
      let classes: Class[] = [];
      let notifications: Notification[] = [];
      let assignments: Assignment[] = [];

if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
  try {
    const assignmentsData = await (responses[3].value as Response).json();
    if (assignmentsData.success && Array.isArray(assignmentsData.assignments)) {
      assignments = assignmentsData.assignments;
    }
  } catch (e) {
    console.error('Error parsing assignments data:', e);
  }
}

      // Handle students response
      if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
        try {
          const studentsData = await (responses[0].value as Response).json();
          if (studentsData.success && Array.isArray(studentsData.students)) {
            students = studentsData.students;
          }
        } catch (e) {
          console.error('Error parsing students data:', e);
        }
      }

      // Handle classes response
      if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
        try {
          const classesData = await (responses[1].value as Response).json();
          if (classesData.success && Array.isArray(classesData.classes)) {
            classes = classesData.classes;
          }
        } catch (e) {
          console.error('Error parsing classes data:', e);
        }
      }

      // Handle notifications response
      if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
        try {
          const notificationsData = await (responses[2].value as Response).json();
          if (notificationsData.success && Array.isArray(notificationsData.notifications)) {
            notifications = notificationsData.notifications;
          }
        } catch (e) {
          console.error('Error parsing notifications data:', e);
        }
      }

      // Calculate today's birthdays
      const today = new Date();
      const todaysBirthdays: Birthday[] = students
        .filter((student: Student) => {
          if (!student.date_of_birth) return false;
          try {
            const birthDate = new Date(student.date_of_birth);
            return (
              birthDate.getMonth() === today.getMonth() &&
              birthDate.getDate() === today.getDate()
            );
          } catch (e) {
            return false;
          }
        })
        .map((student: Student) => ({
          id: student.id,
          name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
          class: student.class_name || 'N/A',
          age: student.date_of_birth 
            ? today.getFullYear() - new Date(student.date_of_birth).getFullYear()
            : 0
        }));

      // Generate recent activities based on actual data
      const recentActivities: Activity[] = [];
      
      // Add recent student activities
      if (students.length > 0) {
        const recentStudents = students.slice(-3).reverse();
        recentStudents.forEach((student: Student, index: number) => {
          recentActivities.push({
            id: Date.now() + index,
            activity: `New student "${student.first_name || ''} ${student.last_name || ''}" enrolled in ${student.class_name || 'N/A'}`,
            time: getRelativeTime(student.created_at),
            type: "enrollment"
          });
        });
      }

      // Add recent notification activities
      if (notifications.length > 0) {
        const recentNotifications = notifications.slice(-2).reverse();
        recentNotifications.forEach((notification: Notification, index: number) => {
          recentActivities.push({
            id: Date.now() + index + 100,
            activity: `New notification: "${notification.title || 'Untitled'}"`,
            time: getRelativeTime(notification.created_at),
            type: "notification"
          });
        });
      }

if (assignments.length > 0) {
  const recentAssignments = assignments.slice(-3).reverse();
  recentAssignments.forEach((assignment, index) => {
    recentActivities.push({
      id: Date.now() + index + 200,
      activity: `New Assignment: "${assignment.title}" for ${assignment.class_name || 'N/A'}`, // Use class_name
      time: getRelativeTime(assignment.created_at),
      type: "assignment"
    });
  });
}

      // If no real activities, add default one
      if (recentActivities.length === 0) {
        recentActivities.push({
          id: 1,
          activity: "Welcome to the school management system!",
          time: "Recently",
          type: "system"
        });
      }

      // Count unique teachers from classes
      const uniqueTeachers = new Set(
        classes.map((cls: Class) => cls.teacher_name || 'Unknown')
      ).size;

      // Update dashboard data
      setDashboardData(prevData => ({
        todaysBirthdays: todaysBirthdays.length > 0 ? todaysBirthdays : prevData.todaysBirthdays,
        stats: {
          totalStudents: students.length,
          totalTeachers: uniqueTeachers > 0 ? uniqueTeachers : 2, // Default to 2 if no real data
          totalClasses: classes.length > 0 ? classes.length : 8, // Default to 8 if no real data
          activeNotifications: notifications.filter((n: Notification) => !n.is_read).length
        },
        recentActivities: recentActivities.slice(0, 5)
      }));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Keep existing mock data if API fails
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString?: string): string => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMilliseconds = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInHours < 1) return 'Recently';
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return 'Recently';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getActivityIcon = (type: string): string => {
    const icons: Record<string, string> = {
      enrollment: "👥",
      results: "📊",
      meeting: "🤝",
      reminder: "⏰",
      notification: "📢",
      system: "🔧",
      assignment: "📝", 
    };
    return icons[type] || "📝";
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen flex flex-col">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-xl border-b-4 border-blue-200">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">SP</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-wide">MyDschool Portal</h1>
            </div>
            
            <nav className="flex items-center space-x-1">
              {[
                { name: 'Dashboard', path: '/dashboard', active: true },
                { name: 'Sections', path: '/sections' },
                { name: 'Classes', path: '/classes' },
                {name: "Assignments", path: '/assignments'},
                { name: 'Profile', path: '/profile' },
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
                onClick={handleLogout}
                className="ml-2 px-3 py-2 bg-white/10 hover:bg-red-600 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Flexible Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 py-6">
        {/* Welcome Section - Full Width */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back!</h2>
                <p className="text-blue-200 text-sm mt-2">{formatDate(currentTime)}</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl sm:text-2xl font-mono font-bold">{formatTime(currentTime)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Responsive Horizontal Layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
          {[
            { title: "Total Students", value: dashboardData.stats.totalStudents, icon: "👥", color: "from-blue-500 to-blue-600" },
            { title: "Total Classes", value: dashboardData.stats.totalClasses, icon: "🏫", color: "from-purple-500 to-purple-600" },
            { title: "Notifications", value: dashboardData.stats.activeNotifications, icon: "🔔", color: "from-orange-500 to-orange-600" }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                <div className="text-center sm:text-left">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">{stat.title}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-r ${stat.color} rounded-lg md:rounded-xl flex items-center justify-center text-lg sm:text-xl md:text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
          
          
 {/* Quick Actions - Horizontal Flexible */}
        <div><button 
              onClick={loadDashboardData}
              className="w-full mt-4 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh Activities →
            </button></div> <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { name: "Add Student", icon: "👥", color: "from-blue-500 to-blue-600", href: "/profile" },
              { name: "Manage Classes", icon: "🏫", color: "from-green-500 to-green-600", href: "/classes" },
              { name: "Send Notice", icon: "📢", color: "from-purple-500 to-purple-600", href: "/notifications" },
              { name: "Assignments", icon: "📝", color: "from-orange-500 to-orange-600", href: "/assignments" }
              
            ].map((action, index) => (
              <a 
                key={index}
                href={action.href}
                className={`p-3 sm:p-4 bg-gradient-to-r ${action.color} text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-xs sm:text-sm text-center block`}
              >
                <span className="text-xl sm:text-2xl block mb-2">{action.icon}</span>
                <span className="leading-tight">{action.name}</span>
              </a>
            ))}</div></div>
        {/* Main Dashboard Content - Flexible Horizontal Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6">
          {/* Today's Birthdays - Flexible */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Today's Birthdays</h3>
              <span className="text-xl sm:text-2xl">🎉</span>
            </div>
            {dashboardData.todaysBirthdays.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 overflow-y-auto">
                {dashboardData.todaysBirthdays.map((student) => (
                  <div key={student.id} className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold mr-3 text-xs sm:text-sm">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{student.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Class {student.class} • Age {student.age}</p>
                    </div>
                    <span className="text-pink-500 font-bold text-lg sm:text-xl">🎂</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm sm:text-base">No birthdays today</p>
            )}
          </div>

         
          {/* Recent Activities - Flexible */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Recent Activities</h3>
              <span className="text-xl sm:text-2xl">📋</span>
            </div>
            <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-80 overflow-y-auto">
              {dashboardData.recentActivities.length > 0 ? (
                dashboardData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <span className="text-base sm:text-lg mr-3 flex-shrink-0">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 leading-snug">{activity.activity}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8 text-sm">No recent activities</p>
              )}
            </div>
         

       
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 text-center py-4 sm:py-6 mt-auto">
        <div className="w-full px-4 sm:px-6">
          <p className="text-xs sm:text-sm">© 2025 MyDschool Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}