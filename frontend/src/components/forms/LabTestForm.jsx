import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const LabTestForm = ({ 
  onSubmit, 
  onCancel, 
  currentDoctor,
  preselectedPatient = null
}) => {
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: currentDoctor?.doctor_id || '',
    test_name: '',
    notes: '',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);

  // Fetch patients for the dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await apiClient.get('/patients/');
        setPatients(response.data || []);
        
        // Set preselected patient if provided
        if (preselectedPatient && preselectedPatient.patient_id) {
          setFormData(prev => ({
            ...prev,
            patient_id: preselectedPatient.patient_id
          }));
        }
      } catch (error) {
        console.error('Error fetching patients for lab test form:', error);
        setError('Failed to load patients data.');
      }
    };

    fetchPatients();
  }, [preselectedPatient]);

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
      // Make a copy of the form data for submission
      const submissionData = { ...formData };
      
      // Convert string IDs to integers
      if (submissionData.patient_id) {
        const patientId = parseInt(submissionData.patient_id, 10);
        submissionData.patient_id = patientId;
        submissionData.patient = patientId; // Add the 'patient' field expected by the API
        
        const selectedPatient = patients.find(p => p.patient_id === patientId);
        if (selectedPatient) {
          submissionData.patient_name = `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim();
        }
      }
      
      if (submissionData.doctor_id) {
        const doctorId = parseInt(submissionData.doctor_id, 10);
        submissionData.doctor_id = doctorId;
        submissionData.doctor = doctorId; // Add the 'doctor' field expected by the API
      }
      
      console.log('Submitting lab test with data:', submissionData);
      
      // Send the lab test order to the API
      const response = await apiClient.post('/lab-tests/', submissionData);
      
      console.log('Lab test ordered successfully:', response.data);
      setLoading(false);
      onSubmit(response.data);
    } catch (error) {
      console.error('Error ordering lab test:', error);
      setError(`Failed to order lab test: ${error.response?.data?.detail || error.message || 'Please try again.'}`);
      setLoading(false);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="patient_id">Patient*</label>
        <select
          id="patient_id"
          name="patient_id"
          value={formData.patient_id || ''}
          onChange={handleChange}
          required
        >
          <option value="">Select Patient</option>
          {patients.map(patient => (
            <option key={patient.patient_id} value={patient.patient_id}>
              {patient.first_name} {patient.last_name} ({patient.reg_num})
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="test_name">Test Name*</label>
        <input
          id="test_name"
          name="test_name"
          type="text"
          value={formData.test_name || ''}
          onChange={handleChange}
          required
          placeholder="e.g., Complete Blood Count (CBC), Liver Function Test, etc."
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="notes">Notes (Optional)</label>
        <textarea
          id="notes"
          name="notes"
          rows="3"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Additional information or instructions for the lab technician"
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
          {loading ? 'Submitting...' : 'Order Lab Test'}
        </button>
      </div>
    </form>
  );
};

export default LabTestForm; 