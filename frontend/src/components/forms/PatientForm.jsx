import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const PatientForm = ({ patient = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    reg_num: '',
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    email: '',
    contact_number: '',
    address: '',
    blood_group: '',
    medical_history: '',
    ...(patient || {})
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For edit mode, populate form with patient data
  useEffect(() => {
    if (patient && patient.patient_id) {
      // Format date for the input field (YYYY-MM-DD)
      const formattedPatient = { ...patient };
      if (formattedPatient.date_of_birth) {
        const date = new Date(formattedPatient.date_of_birth);
        formattedPatient.date_of_birth = date.toISOString().split('T')[0];
      }
      
      setFormData(prevData => ({
        ...prevData,
        ...formattedPatient
      }));
    } else if (!formData.reg_num) {
      // Generate a new registration number for new patients
      generateRegNum();
    }
  }, [patient]);

  const generateRegNum = async () => {
    try {
      // In a real app, you would get this from the backend
      // For now, we'll simulate it
      const newRegNum = `PT${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      // Check if we're creating a new patient or updating
      if (patient && patient.patient_id) {
        // Update existing patient
        response = await apiClient.put(`/patients/${patient.patient_id}/`, formData);
      } else {
        // Create new patient
        response = await apiClient.post('/patients/', formData);
      }
      
      setLoading(false);
      onSubmit(response.data);
    } catch (error) {
      setError('Failed to save patient information. Please try again.');
      setLoading(false);
      console.error('Error saving patient:', error);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="reg_num">Registration Number</label>
        <input
          id="reg_num"
          name="reg_num"
          type="text"
          value={formData.reg_num || ''}
          readOnly
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
            onChange={handleChange}
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