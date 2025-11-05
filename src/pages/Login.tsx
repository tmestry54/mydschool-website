import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { authAPI } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 50);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username.trim() || !password) {
      setMsg("Please enter both username and password");
      return;
    }

    setLoading(true);
    setMsg("");
   try {
      console.log('🔐 Attempting login with:', { username });
      const response = await authAPI.login(username, password);
      console.log('📥 Login response:', response);
      
      if (response.success) {
        console.log('✅ Login successful!');
        
        // Save user data
        sessionStorage.setItem("currentUser", JSON.stringify(response.user));
        localStorage.setItem("currentUser", JSON.stringify(response.user));
        
        console.log('✅ User data saved, navigating...');
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 100);
      } else {
        console.log('❌ Login failed:', response.message);
        setMsg(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setMsg(error.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 transition-opacity duration-1000 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-ping"></div>
        <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse delay-700"></div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto transform transition-transform duration-700 hover:scale-[1.01]">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-500 hover:shadow-indigo-500/30">
          <div className="grid lg:grid-cols-2">
            {/* Left Branding */}
            <div className="p-12 lg:p-16 text-white">
              <div className="mb-8 transform transition-transform duration-700 hover:scale-105">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl mb-6 shadow-lg animate-bounce">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  MyDschool Portal
                </h1>
                <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                  <strong>Empowering Education Through Innovation</strong>
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { color: "yellow-400", text: "Smart Learning Management System" },
                  { color: "green-400", text: "Comprehensive Student Analytics" },
                  { color: "blue-400", text: "Seamless Communication Hub" },
                  { color: "purple-400", text: "Modern Administrative Tools" }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 hover:translate-x-1 transition-transform duration-300"
                  >
                    <div className={`w-2 h-2 bg-${item.color} rounded-full`}></div>
                    <p className="text-gray-200 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Login Form */}
            <div className="p-12 lg:p-16 flex items-center justify-center bg-white/5">
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 transform transition-all duration-500 hover:shadow-indigo-500/30"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2 animate-pulse">Welcome Back</h2>
                  <p className="text-gray-600">Sign in to access your dashboard</p>
                </div>

                {msg && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{msg}</p>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="relative group">
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Enter your username"
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 group-hover:border-indigo-400"
                    />
                    <svg className="absolute left-4 top-11 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>

                  <div className="relative group">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      disabled={loading}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 group-hover:border-indigo-400"
                    />
                    <svg className="absolute left-4 top-11 w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-11 text-gray-400 hover:text-indigo-600 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-8 py-3 px-4 rounded-lg font-semibold text-white transform transition-all duration-300 ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  {loading ? "Signing you in..." : "Sign In"}
                </button>

                {/* Demo Credentials */}
                <div className="mt-8 text-xs text-gray-600">
                  <p className="font-semibold text-center mb-2">Demo Credentials</p>
                  <div className="grid gap-2">
                      <div className="flex justify-between items-center bg-gray-100 p-2 rounded hover:bg-indigo-50 transition-colors"
                      >
                        <span className="font-medium">Admin:</span>
  <code>Username: admin, Password: admin@123</code>
                      </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}