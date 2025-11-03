// admin-credentials.ts
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin@123"
};

// Additional credentials for different user types (optional)
export const USER_CREDENTIALS = {
  admin: {
    username: "admin",
    password: "admin@123",
    role: "admin",
    redirectPath: "/dashboard"
  },
  student: {
    username: "student", 
    password: "student123",
    role: "student",
    redirectPath: "/student-dashboard"
  },
  teacher: {
    username: "teacher",
    password: "teacher123", 
    role: "teacher",
    redirectPath: "/teacher-dashboard"
  }
};




