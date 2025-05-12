// Authentication service that connects to the backend API
import apiClient from '../api/client';

const AuthService = {
  // Login function
  login: async (username, password, userType) => {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    try {
      // Call our custom API login endpoint
      const response = await apiClient.post('/login/', {
        username,
        password,
        userType
      });

      if (response.status === 200 && response.data) {
        // The API now returns user data directly
        const userData = response.data;
        
        // Set token in axios default headers for future requests
        if (userData.token) {
          apiClient.defaults.headers.common['Authorization'] = `Token ${userData.token}`;
          console.log('Auth token set in headers');
        }
        
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // For development/demo purposes, fall back to the hardcoded credentials
      // Remove this in production
      console.warn('Falling back to development credentials');
      
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
        let user = {
          username,
          userType,
          token: 'demo-token-' + Math.random().toString(36).substr(2, 9),
          fullName: username.charAt(0).toUpperCase() + username.slice(1),
        };
        
        // Add role-specific properties
        if (userType === 'Admin') {
          user = {
            ...user,
            isStaff: true,
            isSuperuser: true,
          };
        } else if (userType === 'Doctor') {
          user = {
            ...user,
            doctorId: 1,
            specialization: 'General Medicine',
            department: 'Internal Medicine'
          };
        }
        
        // Set token in axios default headers
        apiClient.defaults.headers.common['Authorization'] = `Token ${user.token}`;
        console.log('Demo auth token set in headers');
        
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      
      throw error;
    }
  },
  
  // Logout function
  logout: async () => {
    try {
      // Clear the authorization header
      delete apiClient.defaults.headers.common['Authorization'];
      console.log('Cleared auth token from headers');
      
      // Call our custom API logout endpoint
      await apiClient.post('/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove local storage data regardless of server response
      localStorage.removeItem('user');
    }
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