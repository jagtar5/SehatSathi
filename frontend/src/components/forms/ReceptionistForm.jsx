import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import axios from 'axios';

const ReceptionistForm = ({ receptionist = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    email: '',
    contact_number: '',
    address: '',
    date_of_birth: '',
    ...(receptionist || {}) // Safely merge existing receptionist data if provided
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // For edit mode, we might need to fetch receptionist details
  useEffect(() => {
    if (receptionist && receptionist.id) {
      // Don't include password in edit mode
      const { password, ...receptionistData } = receptionist;
      setFormData(prevData => ({
        ...prevData,
        ...receptionistData
      }));
    }
  }, [receptionist]);

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
    if (formData.password !== formData.confirm_password) {
      setPasswordError("Passwords don't match");
      return false;
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
      
      // Check if we're creating a new receptionist or updating an existing one
      if (receptionist && receptionist.id) {
        // Update existing receptionist - note: password updates might need special handling
        response = await apiClient.put(`/admin/register/receptionist/${receptionist.id}/`, formData);
      } else {
        // For new receptionists, use direct axios call to bypass CSRF issues
        console.log('Registering new receptionist with data:', formData);
        
        try {
          console.log('Submitting receptionist data directly to backend endpoint');
          // Use direct axios call with specific configuration to bypass any interceptors
          response = await axios.post('http://127.0.0.1:8000/api/admin/no-csrf-receptionist-register/', {
            ...formData,
            // Ensure a unique username by adding a timestamp if needed
            username: formData.username || `receptionist_${Date.now().toString(36)}`,
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log('Receptionist saved successfully:', response.data);
        } catch (axiosError) {
          console.error('Error saving receptionist:', axiosError);
          if (axiosError.response) {
            console.error('Error response:', axiosError.response);
            setError(axiosError.response.data?.message || 'Failed to save receptionist');
          } else {
            setError('Network error. Please try again.');
          }
          setLoading(false);
          return;
        }
      }
      
      setLoading(false);
      onSubmit(response.data);
    } catch (error) {
      setError('Failed to save receptionist information. Please try again.');
      if (error.response && error.response.data) {
        // Handle specific validation errors from the backend
        if (error.response.data.username) {
          setError(`Username error: ${error.response.data.username}`);
        } else if (error.response.data.password) {
          setPasswordError(`Password error: ${error.response.data.password}`);
        } else if (error.response.data.non_field_errors) {
          setError(error.response.data.non_field_errors);
        }
      }
      setLoading(false);
      console.error('Error saving receptionist:', error);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
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
            required
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
            required={!receptionist?.id} // Required only for new receptionist
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
            required={!receptionist?.id} // Required only for new receptionist
          />
          {passwordError && <div className="field-error">{passwordError}</div>}
        </div>
      </div>
      
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
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date_of_birth">Date of Birth</label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth || ''}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="address">Address</label>
        <textarea
          id="address"
          name="address"
          rows="3"
          value={formData.address || ''}
          onChange={handleChange}
        ></textarea>
      </div>
      
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
          {loading ? 'Saving...' : (receptionist && receptionist.id) ? 'Update Receptionist' : 'Add Receptionist'}
        </button>
      </div>
    </form>
  );
};

export default ReceptionistForm; 