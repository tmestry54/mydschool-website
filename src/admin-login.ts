interface LoginResult {
  success: boolean;
  role?: string;
  message?: string;
  redirectPath?: string;
  userId?: string;
  user?: any;
}

// ✅ This should automatically use production URL when deployed
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function adminLogin(username: string, password: string): Promise<LoginResult> {
  try {
    console.log('🔄 Attempting login for:', username);
    console.log('🌐 API URL:', API_BASE_URL); // Debug log
    
    // ✅ Remove health check - just try login directly
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username: username.trim(), 
        password: password 
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📡 API Response:', data);
    
    return data;
    
  } catch (error: any) {
    console.error('❌ Network error:', error);
    
    // Provide specific error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        message: 'Cannot connect to server. Please check your internet connection.'
      };
    }
    
    return {
      success: false,
      message: error.message || 'Login failed. Please try again.'
    };
  }
}