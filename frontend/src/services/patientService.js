import apiClient from '../api/client';

// Patient profile services
export const getPatientProfile = async () => {
  try {
    const userResponse = await apiClient.get('/current-user/');
    if (!userResponse.data || userResponse.data.userType !== 'Patient') {
      throw new Error('Not authenticated as a patient');
    }
    
    const patientProfileResponse = await apiClient.get('/patients/');
    
    // Find the current patient's profile
    const patientProfile = patientProfileResponse.data.find(
      profile => profile.user_details.id === userResponse.data.id
    );
    
    if (!patientProfile) {
      throw new Error('Patient profile not found');
    }
    
    return patientProfile;
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    throw error;
  }
};

export const updatePatientProfile = async (profileId, profileData) => {
  try {
    const response = await apiClient.patch(`/patients/${profileId}/`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating patient profile:', error);
    throw error;
  }
};

// Appointment services
export const getPatientAppointments = async () => {
  try {
    const response = await apiClient.get('/appointments/');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    throw error;
  }
};

export const bookAppointment = async (appointmentData) => {
  try {
    const response = await apiClient.post('/appointments/', appointmentData);
    return response.data;
  } catch (error) {
    console.error('Error booking appointment:', error);
    throw error;
  }
};

export const cancelAppointment = async (appointmentId) => {
  try {
    const response = await apiClient.patch(`/appointments/${appointmentId}/cancel/`, {});
    return response.data;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
};

// Medical records services
export const getPatientMedicalRecords = async () => {
  try {
    const response = await apiClient.get('/medical-records/');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw error;
  }
};

// Lab test services
export const getPatientLabTests = async () => {
  try {
    const response = await apiClient.get('/lab-tests/');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    throw error;
  }
};

// Doctor services for appointment booking
export const getDoctors = async () => {
  try {
    const response = await apiClient.get('/doctors/');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
}; 