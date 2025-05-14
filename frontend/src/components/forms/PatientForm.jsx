import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import axios from 'axios';

const PatientForm = ({ patient = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    reg_num: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    contact_number: '',
    email: '',
    address: '',
    blood_group: '',
    medical_history: '',
    ...(patient || {})
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // For edit mode, populate form with patient data
  useEffect(() => {
    if (patient && patient.patient_id) {
      // Format date for the input field (YYYY-MM-DD)
      const formattedPatient = { ...patient };
      if (formattedPatient.date_of_birth) {
        const date = new Date(formattedPatient.date_of_birth);
        formattedPatient.date_of_birth = date.toISOString().split('T')[0];
      }
      
      // Ensure gender is 'Male', 'Female', or 'Other' not 'M', 'F', 'O'
      if (formattedPatient.gender === 'M') formattedPatient.gender = 'Male';
      if (formattedPatient.gender === 'F') formattedPatient.gender = 'Female';
      if (formattedPatient.gender === 'O') formattedPatient.gender = 'Other';
      
      // Don't include password in edit mode
      const { password, ...patientData } = formattedPatient;
      
      setFormData(prevData => ({
        ...prevData,
        ...patientData
      }));
    } else if (!formData.reg_num) {
      // Generate a new registration number for new patients
      generateRegNum();
    }
  }, [patient]);

  const generateRegNum = async () => {
    try {
      // Generate a unique patient registration number
      const prefix = 'PT';
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      // Add a timestamp component for uniqueness (last 4 digits of timestamp)
      const timestamp = Date.now().toString().slice(-4);
      // Add a random suffix for additional uniqueness
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newRegNum = `${prefix}${randomNum}${timestamp}`;
      setFormData(prev => ({ ...prev, reg_num: newRegNum }));
    } catch (error) {
      console.error('Error generating registration number:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear password error when either password field changes
    if (name === 'password' || name === 'confirm_password') {
      setPasswordError('');
    }
  };

  const validateForm = () => {
    // Password validation only for new patients or when updating password
    if (formData.password || formData.confirm_password || !patient?.patient_id) {
      if (formData.password !== formData.confirm_password) {
        setPasswordError("Passwords don't match");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage(''); // Clear any previous success message

    try {
      let response;
      
      // Check if we're creating a new patient or updating
      if (patient && patient.patient_id) {
        // For existing patients, use the standard API
        // The backend won't update authentication details this way
        response = await apiClient.put(`/patients/${patient.patient_id}/`, formData);
      } else {
        // For new patients, use the admin API that creates both User and Patient
        // Ensure we're using the correct endpoint
        console.log('Registering new patient with data:', formData);
        
        // Make sure reg_num is included in the data
        if (!formData.reg_num) {
          setError('Registration number is required');
          setLoading(false);
          return;
        }
        
        // Make sure gender is one of the valid choices
        if (!['Male', 'Female', 'Other'].includes(formData.gender)) {
          setError('Please select a valid gender (Male, Female, or Other)');
          setLoading(false);
          return;
        }
        
        // Skip CSRF token fetching since backend endpoint is now csrf_exempt
        console.log('Submitting patient data directly to backend endpoint');
        
        // Use direct axios call with specific configuration to bypass any interceptors
        // Using the new CSRF-free endpoint
        response = await axios.post('http://127.0.0.1:8000/api/admin/no-csrf-patient-register/', {
          ...formData,
          // Ensure a unique username by adding a timestamp if needed
          username: formData.username || `patient_${Date.now().toString(36)}`,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      console.log('Patient saved successfully:', response.data);
      
      // Set success message instead of using toast
      setSuccessMessage('Patient saved successfully!');
      
      // Notify parent component
      if (onSubmit) {
        onSubmit(response.data);
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Error response:', error.response);
        
        // Handle specific error messages from the backend
        if (error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors;
          
          if (errors.username) {
            setError(`Username error: ${errors.username[0]}`);
          } else if (errors.password) {
            setError(`Password error: ${errors.password[0]}`);
          } else if (errors.non_field_errors) {
            setError(errors.non_field_errors[0]);
          } else {
            setError(error.response.data?.message || 'Failed to save patient. Please try again.');
          }
        } else {
          setError(error.response.data?.message || 'Failed to save patient. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Gender selection handler
  const handleGenderChange = (e) => {
    const value = e.target.value;
    // Ensure we're using the full value (Male/Female/Other) not single-character
    setFormData(prevData => ({
      ...prevData,
      gender: value
    }));
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      {successMessage && <div className="form-success">{successMessage}</div>}
      
      <h4>Patient Information</h4>
      <div className="form-group">
        <label htmlFor="reg_num">Registration Number*</label>
        <input
          id="reg_num"
          name="reg_num"
          type="text"
          value={formData.reg_num || ''}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="first_name">First Name*</label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">Last Name*</label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name || ''}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="gender">Gender*</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender || ''}
            onChange={handleGenderChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="date_of_birth">Date of Birth*</label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth || ''}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="contact_number">Contact Number*</label>
          <input
            id="contact_number"
            name="contact_number"
            type="tel"
            value={formData.contact_number || ''}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input
          id="address"
          name="address"
          type="text"
          value={formData.address || ''}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="blood_group">Blood Group</label>
          <select
            id="blood_group"
            name="blood_group"
            value={formData.blood_group || ''}
            onChange={handleChange}
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="medical_history">Medical History</label>
        <textarea
          id="medical_history"
          name="medical_history"
          rows="3"
          value={formData.medical_history || ''}
          onChange={handleChange}
        ></textarea>
      </div>
      
      {/* Only show authentication fields for new patients */}
      {!patient?.patient_id && (
        <>
          <h4>Login Credentials</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username*</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username || ''}
                onChange={handleChange}
                required={!patient?.patient_id}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password*</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleChange}
                required={!patient?.patient_id}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password*</label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password || ''}
                onChange={handleChange}
                required={!patient?.patient_id}
              />
              {passwordError && <div className="field-error">{passwordError}</div>}
            </div>
          </div>
        </>
      )}
      
      <div className="modal-actions">
        <button 
          type="button" 
          className="cancel-btn" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
        >
          {loading ? 'Saving...' : (patient && patient.patient_id) ? 'Update Patient' : 'Register Patient'}
        </button>
      </div>
    </form>
  );
};

export default PatientForm; 