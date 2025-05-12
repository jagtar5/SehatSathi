import axios from 'axios';

console.log('API Client initializing with base URL:', 'http://127.0.0.1:8000/api');

// Create axios instance
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: true // Include cookies for session authentication
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
    this.data = {};
    this.timestamp = {};
  }
};

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
      email: 'michael.brown@example.com'
    },
    {
      patient_id: 2,
      reg_num: 'PT002',
      first_name: 'Emily',
      last_name: 'Davis',
      gender: 'Female',
      date_of_birth: '1990-07-25',
      contact_number: '555-444-3333',
      email: 'emily.davis@example.com'
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
  ]
};

// Special handling for auth endpoints
const handleAuthEndpoint = (config) => {
  // For auth endpoints, we need to adjust the URL
  if (config.url === '/login/') {
    config.url = '/login/';
    config.baseURL = 'http://127.0.0.1:8000/api'; // Ensure we're using the API endpoint
  } else if (config.url === '/logout/') {
    config.url = '/logout/';
    config.baseURL = 'http://127.0.0.1:8000/api'; // Ensure we're using the API endpoint
  }
  return config;
};

// Request interceptor for caching and logging
apiClient.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    
    // Handle auth endpoints
    config = handleAuthEndpoint(config);
    
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
    
    // Cache the successful GET response
    if (response.config.method === 'get') {
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
      
      // If it's a network error or backend not running, return mock data
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        console.warn(`Network error detected. Using mock data for: ${path}`);
        
        if (path) {
          // Extract endpoint from full path
          const endpoint = path.split('/').pop();
          if (MOCK_DATA[endpoint]) {
            console.log(`Found mock data for ${endpoint}`);
            // Cache this mock data too
            cache.set(path, MOCK_DATA[endpoint]);
            return Promise.resolve({ data: MOCK_DATA[endpoint], config: error.config });
          }
        }
      } else if (error.response && error.response.status === 404) {
        // For 404s, also use mock data if available
        const endpoint = path.split('/').pop();
        if (MOCK_DATA[endpoint]) {
          console.log(`Resource not found. Using mock data for ${endpoint}`);
          cache.set(path, MOCK_DATA[endpoint]);
          return Promise.resolve({ data: MOCK_DATA[endpoint], config: error.config });
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 