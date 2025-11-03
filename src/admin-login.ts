interface LoginResult {
  success: boolean;
  role?: string;
  message?: string;
  redirectPath?: string;
  userId?: string;
  user?: any;
}
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export async function adminLogin(username: string, password: string): Promise<LoginResult> {
  try {
    console.log('🔄 Attempting login for:', username);
    
    // First check if backend is reachable
    const healthCheck = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!healthCheck.ok) {
      throw new Error('Backend server is not responding');
    }
    
    // Proceed with login
    const response = await fetch(`${API_BASE_URL}/login`, {
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
      throw new Error(`HTTP error! status: ${response.status}`);
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
        message: 'Cannot connect to server. Please ensure the backend is running on http://localhost:3001'
      };
    }
    
    return {
      success: false,
      message: error.message || 'Login failed. Please try again.'
    };
  }
}