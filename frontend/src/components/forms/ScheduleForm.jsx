import React, { useState } from 'react';
import apiClient from '../../api/client';

const ScheduleForm = ({ 
  schedule, 
  onSubmit, 
  onCancel, 
  currentDoctor,
  readOnly = false
}) => {
  // Ensure schedule is an object even when null/undefined is passed
  const scheduleData = schedule || {};
  
  const initialData = {
    day_of_week: scheduleData.day_of_week || '',
    start_time: scheduleData.start_time || '',
    end_time: scheduleData.end_time || '',
    max_appointments: scheduleData.max_appointments || 5,
    is_available: scheduleData.is_available !== false,
    doctor_id: currentDoctor?.doctor_id || scheduleData.doctor_id || '',
    schedule_id: scheduleData.schedule_id || null
  };

  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    
    setLoading(true);
    setError('');

    try {
      // Format data for submission
      const submissionData = { ...formData };
      
      // Ensure doctor_id is sent as an integer
      if (submissionData.doctor_id) {
        submissionData.doctor_id = parseInt(submissionData.doctor_id, 10);
        submissionData.doctor = submissionData.doctor_id; // Add 'doctor' field for API
      }
      
      // Ensure max_appointments is a number
      submissionData.max_appointments = parseInt(submissionData.max_appointments, 10);

      console.log('Submitting schedule data:', submissionData);
      
      let response;
      if (scheduleData.schedule_id) {
        // Update existing schedule
        response = await apiClient.put(`/doctor-schedules/${scheduleData.schedule_id}/`, submissionData);
      } else {
        // Create new schedule
        response = await apiClient.post('/doctor-schedules/', submissionData);
      }
      
      console.log('Schedule saved successfully:', response.data);
      setLoading(false);
      onSubmit(response.data);
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError(`Failed to save schedule: ${error.response?.data?.detail || error.message || 'Please try again.'}`);
      setLoading(false);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="day_of_week">Day of Week*</label>
        <select
          id="day_of_week"
          name="day_of_week"
          value={formData.day_of_week}
          onChange={handleChange}
          required
          disabled={readOnly}
        >
          <option value="">Select Day</option>
          {daysOfWeek.map(day => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_time">Start Time*</label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            value={formData.start_time}
            onChange={handleChange}
            required
            disabled={readOnly}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="end_time">End Time*</label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            value={formData.end_time}
            onChange={handleChange}
            required
            disabled={readOnly}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="max_appointments">Maximum Appointments</label>
        <input
          id="max_appointments"
          name="max_appointments"
          type="number"
          min="1"
          max="20"
          value={formData.max_appointments}
          onChange={handleChange}
          required
          disabled={readOnly}
        />
        <small>Maximum number of appointments allowed during this time slot</small>
      </div>
      
      <div className="form-check">
        <input
          id="is_available"
          name="is_available"
          type="checkbox"
          checked={formData.is_available}
          onChange={handleChange}
          disabled={readOnly}
        />
        <label htmlFor="is_available">Available for Appointments</label>
      </div>
      
      <div className="modal-actions">
        <button 
          type="button" 
          className="cancel-btn" 
          onClick={onCancel}
          disabled={loading}
        >
          {readOnly ? 'Close' : 'Cancel'}
        </button>
        {!readOnly && (
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? 'Saving...' : scheduleData.schedule_id ? 'Update Schedule' : 'Create Schedule'}
          </button>
        )}
      </div>
    </form>
  );
};

export default ScheduleForm; 