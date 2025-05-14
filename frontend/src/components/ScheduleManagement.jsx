import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Modal from './Modal';
import ScheduleForm from './forms/ScheduleForm';

const ScheduleManagement = ({ doctorId, currentDoctor }) => {
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleModalMode, setScheduleModalMode] = useState('add');

  // Fetch doctor schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!doctorId) return;
      
      setLoading(true);
      try {
        const response = await apiClient.get(`/doctor-schedules/?doctor=${doctorId}`);
        setDoctorSchedules(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching doctor schedules:", err);
        setError("Failed to load schedules. Please try again.");
        setDoctorSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [doctorId]);

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setScheduleModalMode('add');
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleModalMode('edit');
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = async (schedule) => {
    if (window.confirm(`Are you sure you want to delete this schedule for ${schedule.day_of_week}?`)) {
      try {
        await apiClient.delete(`/doctor-schedules/${schedule.schedule_id}/`);
        // Remove from state
        setDoctorSchedules(doctorSchedules.filter(s => s.schedule_id !== schedule.schedule_id));
        alert('Schedule deleted successfully');
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert(`Failed to delete schedule: ${error.message}`);
      }
    }
  };

  const handleScheduleSubmit = (scheduleData) => {
    if (scheduleModalMode === 'add') {
      // Add new schedule to the list
      setDoctorSchedules([...doctorSchedules, scheduleData]);
    } else {
      // Update existing schedule
      setDoctorSchedules(doctorSchedules.map(s => 
        s.schedule_id === scheduleData.schedule_id ? scheduleData : s
      ));
    }
    setShowScheduleModal(false);
  };

  // Format day of week for display
  const formatDay = (day) => day.charAt(0).toUpperCase() + day.slice(1);

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const [hours, minutes] = timeStr.split(':');
      return `${hours}:${minutes}`;
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="schedule-management">
      <div className="section-header">
        <h2>My Schedule</h2>
        <button className="new-item-btn" onClick={handleAddSchedule}>
          <i className="fas fa-plus"></i> Add Availability
        </button>
      </div>

      <div className="schedule-section">
        <h3>My Availability</h3>
        {loading ? (
          <p>Loading availability schedules...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : doctorSchedules.length === 0 ? (
          <p>You haven't set any availability schedules yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Max. Appointments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctorSchedules.map(schedule => (
                  <tr key={schedule.schedule_id || `schedule-${Math.random()}`}>
                    <td>{formatDay(schedule.day_of_week)}</td>
                    <td>{formatTime(schedule.start_time)}</td>
                    <td>{formatTime(schedule.end_time)}</td>
                    <td>{schedule.max_appointments || 'Unlimited'}</td>
                    <td>
                      <span className={`status-badge ${schedule.is_available ? 'status-confirmed' : 'status-cancelled'}`}>
                        {schedule.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => handleEditSchedule(schedule)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDeleteSchedule(schedule)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <Modal
          title={scheduleModalMode === 'add' ? 'Add Availability' : 'Edit Availability'}
          onClose={() => setShowScheduleModal(false)}
        >
          <ScheduleForm
            schedule={selectedSchedule}
            currentDoctor={currentDoctor}
            onSubmit={handleScheduleSubmit}
            onCancel={() => setShowScheduleModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ScheduleManagement; 