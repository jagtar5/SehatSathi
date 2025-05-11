import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const AppointmentForm = ({ appointment = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: '',
    status: 'Scheduled',
    notes: '',
    ...(appointment || {})
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  // Fetch doctors and patients for the select dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorsResponse, patientsResponse] = await Promise.all([
          apiClient.get('/doctors/'),
          apiClient.get('/patients/')
        ]);
        
        setDoctors(doctorsResponse.data || []);
        setPatients(patientsResponse.data || []);
      } catch (error) {
        console.error('Error fetching data for appointment form:', error);
        setError('Failed to load doctors and patients data.');
      }
    };

    fetchData();

    // For edit mode, format date and time
    if (appointment && appointment.appointment_id && appointment.appointment_date) {
      try {
        const dateTime = new Date(appointment.appointment_date);
        const formattedDate = dateTime.toISOString().split('T')[0];
        const formattedTime = dateTime.toTimeString().slice(0, 5);
        
        setFormData(prev => ({
          ...prev,
          appointment_date: formattedDate,
          appointment_time: formattedTime
        }));
      } catch (error) {
        console.error('Error formatting date/time:', error);
      }
    }
  }, [appointment]);

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
      // Combine date and time for the API
      const formattedData = { ...formData };
      if (formData.appointment_date && formData.appointment_time) {
        formattedData.appointment_date = `${formData.appointment_date}T${formData.appointment_time}:00`;
      }
      
      // Add patient and doctor names for display purposes
      if (formData.patient_id) {
        const selectedPatient = patients.find(p => p.patient_id === parseInt(formData.patient_id));
        if (selectedPatient) {
          formattedData.patient_name = `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim();
        }
      }
      
      if (formData.doctor_id) {
        const selectedDoctor = doctors.find(d => d.doctor_id === parseInt(formData.doctor_id));
        if (selectedDoctor) {
          formattedData.doctor_name = `${selectedDoctor.first_name || ''} ${selectedDoctor.last_name || ''}`.trim();
        }
      }
      
      let response;
      
      // Check if we're creating a new appointment or updating
      if (appointment && appointment.appointment_id) {
        // Update existing appointment
        response = await apiClient.put(`/appointments/${appointment.appointment_id}/`, formattedData);
      } else {
        // Create new appointment
        response = await apiClient.post('/appointments/', formattedData);
      }
      
      setLoading(false);
      onSubmit(response.data);
    } catch (error) {
      setError('Failed to save appointment. Please try again.');
      setLoading(false);
      console.error('Error saving appointment:', error);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-row">
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
          <label htmlFor="doctor_id">Doctor*</label>
          <select
            id="doctor_id"
            name="doctor_id"
            value={formData.doctor_id || ''}
            onChange={handleChange}
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map(doctor => (
              <option key={doctor.doctor_id} value={doctor.doctor_id}>
                Dr. {doctor.first_name} {doctor.last_name} ({doctor.specialization})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="appointment_date">Date*</label>
          <input
            id="appointment_date"
            name="appointment_date"
            type="date"
            value={formData.appointment_date || ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="appointment_time">Time*</label>
          <input
            id="appointment_time"
            name="appointment_time"
            type="time"
            value={formData.appointment_time || ''}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="reason">Reason for Visit*</label>
        <input
          id="reason"
          name="reason"
          type="text"
          value={formData.reason || ''}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status || 'Scheduled'}
            onChange={handleChange}
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rescheduled">Rescheduled</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows="3"
          value={formData.notes || ''}
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
          {loading ? 'Saving...' : (appointment && appointment.appointment_id) ? 'Update Appointment' : 'Schedule Appointment'}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm; 