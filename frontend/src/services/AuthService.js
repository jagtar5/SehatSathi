import apiClient from '../api/client';

const AuthService = {
  // Login function
  login: async (username, password, userType) => {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    try {
      const response = await apiClient.post('/login/', {
        username,
        password,
        userType
      });
      
      const user = {
        username,
        userType,
        fullName: response.data.fullName,
        token: response.data.token
      };
      
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set the auth token for future requests
      apiClient.defaults.headers.common['Authorization'] = `Token ${user.token}`;
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout function
  logout: async () => {
    try {
      await apiClient.post('/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },
  
  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      // Set the auth token for future requests
      apiClient.defaults.headers.common['Authorization'] = `Token ${userData.token}`;
      return userData;
    }
    return null;
  }
};

export default AuthService;
