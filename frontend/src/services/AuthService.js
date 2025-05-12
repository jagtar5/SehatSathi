import apiClient from '../api/client';

const AuthService = {
  // Login function
  login: async (username, password, userType) => {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    try {
<<<<<<< HEAD
      // Call our custom API login endpoint
=======
>>>>>>> 5b558ed6f9668426163c0565ae68c8f3f1845c07
      const response = await apiClient.post('/login/', {
        username,
        password,
        userType
      });
<<<<<<< HEAD

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
=======
>>>>>>> 5b558ed6f9668426163c0565ae68c8f3f1845c07
      
      const user = {
        username,
        userType,
        fullName: response.data.fullName,
        token: response.data.token
      };
      
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
<<<<<<< HEAD
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
      
=======
      // Set the auth token for future requests
      apiClient.defaults.headers.common['Authorization'] = `Token ${user.token}`;
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
>>>>>>> 5b558ed6f9668426163c0565ae68c8f3f1845c07
      throw error;
    }
  },
  
  // Logout function
  logout: async () => {
    try {
<<<<<<< HEAD
      // Clear the authorization header
      delete apiClient.defaults.headers.common['Authorization'];
      console.log('Cleared auth token from headers');
      
      // Call our custom API logout endpoint
=======
>>>>>>> 5b558ed6f9668426163c0565ae68c8f3f1845c07
      await apiClient.post('/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
<<<<<<< HEAD
      // Always remove local storage data regardless of server response
      localStorage.removeItem('user');
=======
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
>>>>>>> 5b558ed6f9668426163c0565ae68c8f3f1845c07
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
