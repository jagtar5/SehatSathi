// Utility to check backend connection and sync data
import apiClient from '../api/client';

export const checkBackendConnection = async () => {
  try {
    console.log('Checking backend connection...');
    // First try to connect to a public endpoint like root API
    try {
      const response = await apiClient.get('/');
      return {
        connected: true,
        statusCode: response.status,
        statusText: 'Connection successful'
      };
    } catch (rootError) {
      console.log('Root API check failed, trying current-user endpoint:', rootError.message);
      
      // If that fails, try the authenticated endpoint
      const response = await apiClient.get('/current-user/');
      return {
        connected: true,
        statusCode: response.status,
        statusText: 'Connection successful (authenticated)'
      };
    }
  } catch (error) {
    console.error('Backend connection check failed:', error);
    return {
      connected: false,
      statusCode: error.response?.status,
      statusText: error.message,
      error
    };
  }
};

// Generate test data and sync with backend
export const createTestData = async () => {
  try {
    console.log('Creating test data...');
    
    // Create test doctors
    const doctor1 = {
      first_name: 'John',
      last_name: 'Smith',
      specialization: 'Cardiology',
      department: 'Cardiology',
      email: 'john.smith@hospital.com',
      contact_number: '555-123-4567'
    };
    
    const doctor2 = {
      first_name: 'Sarah',
      last_name: 'Johnson',
      specialization: 'Neurology',
      department: 'Neurology',
      email: 'sarah.johnson@hospital.com',
      contact_number: '555-987-6543'
    };
    
    // Create test patients
    const patient1 = {
      reg_num: 'PT001',
      first_name: 'Michael',
      last_name: 'Brown',
      gender: 'Male',
      date_of_birth: '1985-03-12',
      contact_number: '555-333-2222',
      email: 'michael.brown@example.com'
    };
    
    const patient2 = {
      reg_num: 'PT002',
      first_name: 'Emily',
      last_name: 'Davis',
      gender: 'Female',
      date_of_birth: '1990-07-25',
      contact_number: '555-444-3333',
      email: 'emily.davis@example.com'
    };
    
    // Send requests to create data
    const doctorResp1 = await apiClient.post('/doctors/', doctor1);
    const doctorResp2 = await apiClient.post('/doctors/', doctor2);
    const patientResp1 = await apiClient.post('/patients/', patient1);
    const patientResp2 = await apiClient.post('/patients/', patient2);
    
    // Create appointments
    const appointment1 = {
      patient_id: patientResp1.data.patient_id,
      doctor_id: doctorResp1.data.doctor_id,
      appointment_date: '2023-07-15T10:00:00',
      reason: 'Annual checkup',
      status: 'Scheduled'
    };
    
    const appointment2 = {
      patient_id: patientResp2.data.patient_id,
      doctor_id: doctorResp2.data.doctor_id,
      appointment_date: '2023-07-16T14:30:00',
      reason: 'Headache consultation',
      status: 'Completed'
    };
    
    const appointmentResp1 = await apiClient.post('/appointments/', appointment1);
    const appointmentResp2 = await apiClient.post('/appointments/', appointment2);
    
    return {
      success: true,
      data: {
        doctors: [doctorResp1.data, doctorResp2.data],
        patients: [patientResp1.data, patientResp2.data],
        appointments: [appointmentResp1.data, appointmentResp2.data]
      }
    };
    
  } catch (error) {
    console.error('Error creating test data:', error);
    return {
      success: false,
      error
    };
  }
};

// Export a function to run this on demand
export const runBackendDiagnostics = async () => {
  // First check connection
  const connectionCheck = await checkBackendConnection();
  console.log('Backend connection check:', connectionCheck);
  
  // If connected, try to create test data
  if (connectionCheck.connected) {
    console.log('Backend connected, checking existing data...');
    
    try {
      // Check if data already exists
      const doctorsResp = await apiClient.get('/doctors/');
      const patientsResp = await apiClient.get('/patients/');
      
      if (doctorsResp.data.length === 0 || patientsResp.data.length === 0) {
        console.log('No existing data found, creating test data...');
        const testData = await createTestData();
        console.log('Test data creation result:', testData);
        return {
          ...connectionCheck,
          dataCreated: testData.success,
          data: testData.data
        };
      } else {
        console.log('Existing data found:', {
          doctors: doctorsResp.data.length,
          patients: patientsResp.data.length
        });
        return {
          ...connectionCheck,
          existingData: true,
          dataCounts: {
            doctors: doctorsResp.data.length,
            patients: patientsResp.data.length
          }
        };
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
      return {
        ...connectionCheck,
        dataCheckError: error.message
      };
    }
  }
  
  return connectionCheck;
};

// Run diagnostics automatically if this file is imported
runBackendDiagnostics(); 