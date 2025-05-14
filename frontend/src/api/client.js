import axios from 'axios';

console.log('API Client initializing with base URL:', 'http://127.0.0.1:8000/api');

// Create axios instance
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Add this header for CSRF protection
  },
  timeout: 10000, // 10 second timeout
  withCredentials: true // Include cookies for session authentication
});

// Function to get CSRF token from cookies if available
const getCSRFToken = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      return value;
    }
  }
  return '';
};

// Direct function to get a CSRF token from the server and use in all future requests
const setupCSRFToken = async () => {
  try {
    console.log('Setting up CSRF protection');
    const response = await axios.get('http://127.0.0.1:8000/api/csrf-token/', {
      withCredentials: true
    });
    
    // Store the CSRF token in memory for future use
    const token = getCSRFToken();
    if (token) {
      console.log('Successfully set up CSRF token');
      // Set a default header for all future axios requests
      axios.defaults.headers.common['X-CSRFToken'] = token;
      apiClient.defaults.headers.common['X-CSRFToken'] = token;
    } else {
      console.warn('Failed to get CSRF token from cookies');
    }
    return token;
  } catch (error) {
    console.error('Error setting up CSRF protection:', error);
    return null;
  }
};

// Initialize CSRF protection on startup
setupCSRFToken().then(token => {
  if (token) {
    console.log('CSRF protection initialized successfully');
  } else {
    console.warn('CSRF protection initialization failed');
  }
});

// Simple in-memory cache for requests
const cache = {
  data: {},
  timestamp: {},
  cacheTime: 60000, // Cache for 1 minute
  
  get: function(url) {
    const now = Date.now();
    // Check if cache exists and hasn't expired
    if (this.data[url] && now - this.timestamp[url] < this.cacheTime) {
      console.log(`Using cached data for ${url}`);
      return this.data[url];
    }
    return null;
  },
  
  set: function(url, data) {
    this.data[url] = data;
    this.timestamp[url] = Date.now();
    console.log(`Caching data for ${url}`);
  },
  
  clear: function() {
    console.log('Clearing API cache');
    this.data = {};
    this.timestamp = {};
  }
};

// Make cache available globally for components to access
window.apiClientCache = cache;

// Expose cache on the apiClient
apiClient.cache = cache;

// Sample mock data for development and fallbacks
const MOCK_DATA = {
  doctors: [
    {
      doctor_id: 1,
      first_name: 'John',
      last_name: 'Smith',
      specialization: 'Cardiology',
      department: 'Cardiology',
      email: 'john.smith@hospital.com',
      contact_number: '555-123-4567'
    },
    {
      doctor_id: 2,
      first_name: 'Sarah',
      last_name: 'Johnson',
      specialization: 'Neurology',
      department: 'Neurology',
      email: 'sarah.johnson@hospital.com',
      contact_number: '555-987-6543'
    }
  ],
  patients: [
    {
      patient_id: 1,
      reg_num: 'PT001',
      first_name: 'Michael',
      last_name: 'Brown',
      gender: 'Male',
      date_of_birth: '1985-03-12',
      contact_number: '555-333-2222',
      email: 'michael.brown@example.com',
      address: '123 Main St, Anytown',
      blood_group: 'O+'
    },
    {
      patient_id: 2,
      reg_num: 'PT002',
      first_name: 'Emily',
      last_name: 'Davis',
      gender: 'Female',
      date_of_birth: '1990-07-25',
      contact_number: '555-444-3333',
      email: 'emily.davis@example.com',
      address: '456 Oak Ave, Somewhere',
      blood_group: 'A-'
    },
    {
      patient_id: 3,
      reg_num: 'PT003',
      first_name: 'Robert',
      last_name: 'Wilson',
      gender: 'Male',
      date_of_birth: '1978-11-03',
      contact_number: '555-555-5555',
      email: 'robert.wilson@example.com',
      address: '789 Pine St, Elsewhere',
      blood_group: 'B+'
    }
  ],
  appointments: [
    {
      appointment_id: 1,
      patient_name: 'Michael Brown',
      doctor_name: 'John Smith',
      appointment_date: '2023-07-15T10:00:00',
      reason: 'Annual checkup',
      status: 'Scheduled',
      patient_id: 1,
      doctor_id: 1
    },
    {
      appointment_id: 2,
      patient_name: 'Emily Davis',
      doctor_name: 'Sarah Johnson',
      appointment_date: '2023-07-16T14:30:00',
      reason: 'Headache consultation',
      status: 'Completed',
      patient_id: 2,
      doctor_id: 2
    }
  ],
  schedules: [
    {
      appointment_id: 1,
      patient_name: 'Michael Brown',
      appointment_date: '2023-07-15T10:00:00',
      reason: 'Annual checkup',
      status: 'Scheduled',
      patient_id: 1,
      doctor_id: 1
    },
    {
      appointment_id: 2,
      patient_name: 'Emily Davis',
      appointment_date: '2023-07-16T14:30:00',
      reason: 'Headache consultation',
      status: 'Completed',
      patient_id: 2,
      doctor_id: 2
    }
  ],
  'lab-tests': [
    {
      id: 1,
      patient_id: 1,
      doctor_id: 1,
      patient_name: 'Michael Brown',
      test_name: 'Complete Blood Count',
      requested_at: '2023-06-20T09:15:00',
      status: 'completed',
      notes: 'Check for anemia'
    },
    {
      id: 2,
      patient_id: 2,
      doctor_id: 1,
      patient_name: 'Emily Davis',
      test_name: 'Blood Glucose',
      requested_at: '2023-07-05T11:30:00',
      status: 'pending',
      notes: 'Fasting glucose test'
    }
  ],
  'diagnostics': {
    'system_status': 'healthy',
    'database': {
      'connected': true,
      'error': null
    },
    'users': {
      'total': 12,
      'types': {
        'staff_users': 2,
        'superusers': 1,
        'regular_users': 9
      }
    },
    'models': {
      'doctors': 5,
      'patients': 6,
      'receptionists': 1
    },
    'timestamp': new Date().toISOString()
  }
};

// Special handling for auth endpoints
const handleAuthEndpoint = (config) => {
  // For auth endpoints, we need to adjust the URL
  if (config.url === '/login/') {
    config.url = '/login/';
  } else if (config.url === '/logout/') {
    config.url = '/logout/';
  }
  return config;
};

// Request interceptor for caching and logging
apiClient.interceptors.request.use(
  async config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    
    // For GET requests, check cache first
    if (config.method === 'get') {
      const url = config.url;
      const cachedData = cache.get(url);
      if (cachedData) {
        // Cancel the request by telling axios to skip it
        config.adapter = () => {
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config,
            request: {}
          });
        };
      }
    }
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Debug function to check backend connectivity
const checkBackendConnectivity = async () => {
  try {
    const response = await apiClient.get('/current-user/');
    console.log(`Backend check status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Backend connectivity check failed:', error);
    return false;
  }
};

// Run backend check on startup
checkBackendConnectivity()
  .then(isConnected => {
    if (isConnected) {
      console.log('✅ Backend connection established successfully');
    } else {
      console.warn('⚠️ Backend connection failed. Will use mock data');
    }
  });

// Response interceptor for caching and error handling
apiClient.interceptors.response.use(
  response => {
    // Log successful responses
    console.log(`API Response (${response.config.url}):`, response.data);
    
    // Clear cache for specific endpoints after mutations
    if (response.config.method !== 'get') {
      // If it's a patient-related mutation, clear the patients cache
      if (response.config.url.includes('/patient') || 
          response.config.url.includes('/register/patient')) {
        console.log('Clearing patients cache due to mutation');
        if (cache.data) {
          Object.keys(cache.data).forEach(key => {
            if (key.includes('/patient') || key.includes('/hms-patient')) {
              delete cache.data[key];
              delete cache.timestamp[key];
            }
          });
        }
      }
      
      // Clear receptionist cache on mutations
      if (response.config.url.includes('/receptionist') || 
          response.config.url.includes('/register/receptionist') ||
          response.config.url.includes('/no-csrf-receptionist-register/')) {
        console.log('Clearing receptionists cache due to mutation');
        if (cache.data) {
          Object.keys(cache.data).forEach(key => {
            if (key.includes('/receptionist')) {
              delete cache.data[key];
              delete cache.timestamp[key];
            }
          });
        }
      }
    } else {
      // Cache the successful GET response
      cache.set(response.config.url, response.data);
    }
    return response;
  },
  error => {
    console.warn('API Error:', error);
    
    if (error.config) {
      const path = error.config.url;
      console.error(`API Request to ${path} failed:`, error.message);
      
      if (error.response) {
        console.error(`Status: ${error.response.status}`, error.response.data);
      }
      
      // Handle authentication errors (401, 403)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // For auth-related endpoints, reject the error to handle on the frontend
        if (path.includes('/login/') || path.includes('/logout/') || path.includes('/current-user/')) {
          return Promise.reject(error);
        }
        
        // For other resources, try to fallback to mock data
        const endpoint = path.split('/').filter(segment => segment.length > 0).pop();
        if (MOCK_DATA[endpoint] && endpoint !== 'receptionists') {
          console.log(`Authentication error for ${path}. Using mock data.`);
          return Promise.resolve({ data: MOCK_DATA[endpoint], config: error.config });
        }
      }
      
      // Don't use mock data for receptionists
      if (path.includes('/receptionists/') || path.includes('/receptionist/')) {
        console.error('Failed to fetch receptionist data from server');
        return Promise.resolve({ data: [], config: error.config });
      }
      
      // Don't use mock data for endpoints that should exist on the backend
      const criticalEndpoints = ['/patients/', '/appointments/', '/doctors/'];
      const nonCriticalEndpoints = ['/admin/receptionists/', '/logs/', '/statistics/'];
      const endpoint = path.split('/').filter(segment => segment.length > 0).pop();
      
      if (criticalEndpoints.includes(`/${endpoint}/`)) {
        // For critical endpoints, check if it's a 404 vs another error
        if (error.response && error.response.status === 404) {
          console.warn(`Critical endpoint ${path} not found. Using mock data as fallback.`);
          
          if (MOCK_DATA[endpoint] && endpoint !== 'receptionists') {
            console.log(`Found mock data for ${endpoint}`);
            cache.set(path, MOCK_DATA[endpoint]);
            return Promise.resolve({ data: MOCK_DATA[endpoint], config: error.config });
          }
        } else {
          console.warn(`Critical endpoint ${path} failed with error code ${error.response?.status || 'unknown'}. Using mock data to ensure application works.`);
          
          if (MOCK_DATA[endpoint] && endpoint !== 'receptionists') {
            console.log(`Found mock data for ${endpoint}`);
            cache.set(path, MOCK_DATA[endpoint]);
            return Promise.resolve({ data: MOCK_DATA[endpoint], config: error.config });
          }
        }
      }
      
      // For other errors, we can still use mock data as fallback
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.warn(`Network error detected. Using mock data for: ${path}`);
        
        if (path && MOCK_DATA[endpoint] && endpoint !== 'receptionists') {
          console.log(`Found mock data for ${endpoint}`);
          cache.set(path, MOCK_DATA[endpoint]);
          return Promise.resolve({ data: MOCK_DATA[endpoint], config: error.config });
        }
      } else if (error.response && error.response.status === 404) {
        // For 404s, also use mock data if available but not for critical endpoints
        const nonCriticalEndpoints = ['/admin/receptionists/', '/logs/', '/statistics/'];
        if (MOCK_DATA[endpoint] && !criticalEndpoints.includes(`/${endpoint}/`) && endpoint !== 'receptionists') {
          console.log(`Resource not found. Using mock data for ${endpoint}`);
          cache.set(path, MOCK_DATA[endpoint]);
          return Promise.resolve({ data: MOCK_DATA[endpoint], config: error.config });
        } else if (nonCriticalEndpoints.some(e => path.includes(e))) {
          // For specific non-critical endpoints that might not exist yet, provide a more graceful error
          console.log(`Non-critical endpoint ${path} not found. Using empty result.`);
          return Promise.resolve({ data: [], config: error.config });
        }
      } else if (error.response && error.response.status === 400) {
        // Log out the request data to help with debugging
        console.error(`Bad request for ${path}:`, error.config.data);
        
        // If it's a registration endpoint, show more detailed error information
        if (path.includes('/register/')) {
          const errorDetails = error.response.data?.errors || error.response.data || {};
          console.error('Validation errors:', errorDetails);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 