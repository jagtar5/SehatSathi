// Authentication service that connects to the backend API
import apiClient from '../api/client';

const AuthService = {
  // Login function
  login: async (username, password, userType) => {
    // For now we'll handle different roles with different endpoints
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    try {
      // In a real implementation, you would make this call to verify credentials
      // The code below simulates a check that only accepts specific credentials
      
      // Default accepted credentials for demo
      const validCredentials = {
        Doctor: { username: 'doctor', password: 'doctor123' },
        Patient: { username: 'patient', password: 'patient123' },
        Receptionist: { username: 'receptionist', password: 'receptionist123' },
        Admin: { username: 'admin', password: 'admin123' }
      };
      
      // Check if credentials match the valid ones for the role
      const validForRole = validCredentials[userType];
      
      if (validForRole && 
          username === validForRole.username && 
          password === validForRole.password) {
        
        // In a real app, this would come from the API response
        const user = {
          username,
          userType,
          token: 'demo-token-' + Math.random().toString(36).substr(2, 9),
          fullName: username.charAt(0).toUpperCase() + username.slice(1),
        };
        
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      } else {
        throw new Error('Invalid credentials for ' + userType);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout function
  logout: () => {
    localStorage.removeItem('user');
  },
  
  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('user');
  },
  
  // Check if user has a specific role
  hasRole: (role) => {
    const user = AuthService.getCurrentUser();
    return user ? user.userType === role : false;
  }
};

export default AuthService; 