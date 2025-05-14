import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import axios from 'axios';

const DoctorForm = ({ doctor = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    specialization: '',
    department: '',
    email: '',
    contact_number: '',
    address: '',
    qualification: '',
    experience: '',
    ...(doctor || {}) // Safely merge existing doctor data if provided
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [departments, setDepartments] = useState([
    'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 
    'Gynecology', 'Dermatology', 'Ophthalmology', 'Psychiatry', 
    'Radiology', 'General Surgery', 'Internal Medicine'
  ]);

  // For edit mode, we might need to fetch doctor details
  useEffect(() => {
    if (doctor && doctor.doctor_id) {
      // Don't include password in edit mode
      const { password, ...doctorData } = doctor;
      setFormData(prevData => ({
        ...prevData,
        ...doctorData
      }));
    }
  }, [doctor]);

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
    // Password validation only for new doctors or when updating password
    if (formData.password || formData.confirm_password || !doctor?.doctor_id) {
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
    
    try {
      let response;
      
      // Check if we're creating a new doctor or updating an existing one
      if (doctor && doctor.doctor_id) {
        // For existing doctors, use the standard API
        // The backend won't update authentication details this way
        response = await apiClient.put(`/doctors/${doctor.doctor_id}/`, formData);
      } else {
        // For new doctors, use direct axios call to the CSRF-exempt endpoint
        console.log('Registering new doctor with data:', formData);
        
        // Use direct axios call with specific configuration to bypass any interceptors
        response = await axios.post('http://127.0.0.1:8000/api/admin/no-csrf-doctor-register/', {
          ...formData,
          // Ensure a unique username by adding a timestamp if needed
          username: formData.username || `doctor_${Date.now().toString(36)}`,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      console.log('Doctor saved successfully:', response.data);
      setLoading(false);
      onSubmit(response.data);
    } catch (error) {
      setError('Failed to save doctor information. Please try again.');
      if (error.response && error.response.data) {
        // Log the entire error response for debugging
        console.log("Backend validation errors:", error.response.data);
        
        // Check if errors object is present
        if (error.response.data.errors) {
          const errors = error.response.data.errors;
          
          // Handle specific validation errors from the backend
          if (errors.username) {
            setError(`Username error: ${errors.username}`);
          } else if (errors.password) {
            setPasswordError(`Password error: ${errors.password}`);
          } else if (errors.email) {
            setError(`Email error: ${errors.email}`);
          } else if (errors.non_field_errors) {
            setError(`${errors.non_field_errors}`);
          } else {
            // Display all error messages
            const errorMessages = Object.entries(errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ');
            setError(`Validation errors: ${errorMessages}`);
          }
        } else if (typeof error.response.data === 'string') {
          setError(error.response.data);
        }
      }
      setLoading(false);
      console.error('Error saving doctor:', error);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <h4>Personal Information</h4>
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
          <label htmlFor="specialization">Specialization*</label>
          <input
            id="specialization"
            name="specialization"
            type="text"
            value={formData.specialization || ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="department">Department*</label>
          <select
            id="department"
            name="department"
            value={formData.department || ''}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email*</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            required
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
          <label htmlFor="qualification">Qualification</label>
          <input
            id="qualification"
            name="qualification"
            type="text"
            value={formData.qualification || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="experience">Experience (years)</label>
          <input
            id="experience"
            name="experience"
            type="number"
            min="0"
            value={formData.experience || ''}
            onChange={handleChange}
          />
        </div>
      </div>
      
      {/* Only show authentication fields for new doctors */}
      {!doctor?.doctor_id && (
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
                required={!doctor?.doctor_id}
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
                required={!doctor?.doctor_id}
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
                required={!doctor?.doctor_id}
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
          {loading ? 'Saving...' : (doctor && doctor.doctor_id) ? 'Update Doctor' : 'Add Doctor'}
        </button>
      </div>
    </form>
  );
};

export default DoctorForm; 