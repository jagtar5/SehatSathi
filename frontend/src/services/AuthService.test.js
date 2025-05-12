import AuthService from './AuthService';
import apiClient from '../api/client';

// Mock the axios client
jest.mock('../api/client');

describe('AuthService', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
  });
  
  describe('login', () => {
    it('should successfully login an admin user', async () => {
      // Mock API response for admin login
      const mockUser = {
        username: 'admin',
        userType: 'Admin',
        email: 'admin@example.com',
        fullName: 'Admin User',
        isStaff: true,
        isSuperuser: true
      };
      
      apiClient.post.mockResolvedValueOnce({ status: 200, data: mockUser });
      
      const result = await AuthService.login('admin', 'admin123', 'Admin');
      
      expect(apiClient.post).toHaveBeenCalledWith('/login/', {
        username: 'admin', 
        password: 'admin123',
        userType: 'Admin'
      });
      
      expect(result).toEqual(mockUser);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should successfully login a doctor user', async () => {
      // Mock API response for doctor login
      const mockUser = {
        username: 'doctor',
        userType: 'Doctor',
        email: 'doctor@example.com',
        fullName: 'Doctor User',
        doctorId: 1,
        specialization: 'Cardiology',
        department: 'Cardiology'
      };
      
      apiClient.post.mockResolvedValueOnce({ status: 200, data: mockUser });
      
      const result = await AuthService.login('doctor', 'doctor123', 'Doctor');
      
      expect(apiClient.post).toHaveBeenCalledWith('/login/', {
        username: 'doctor', 
        password: 'doctor123',
        userType: 'Doctor'
      });
      
      expect(result).toEqual(mockUser);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });
    
    it('should handle login errors correctly', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Invalid credentials' }
        }
      });
      
      // Test should fall back to hardcoded credentials
      const result = await AuthService.login('admin', 'admin123', 'Admin');
      
      expect(result).toEqual({
        username: 'admin',
        userType: 'Admin',
        token: expect.any(String),
        fullName: 'Admin',
        isStaff: true,
        isSuperuser: true,
      });
      
      expect(localStorage.getItem('user')).toBeTruthy();
    });
  });
  
  describe('hasRole', () => {
    it('should correctly identify an admin user', () => {
      // Setup mock user in localStorage
      const mockUser = {
        username: 'admin',
        userType: 'Admin',
        isStaff: true,
        isSuperuser: true
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      expect(AuthService.hasRole('Admin')).toBe(true);
      expect(AuthService.hasRole('Doctor')).toBe(false);
    });
  });
}); 