import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AuthService from '../services/AuthService';
import '../styles/Dashboard.css';

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const dataFetched = useRef(false);

  // Check if user is logged in and has doctor role
  useEffect(() => {
    if (!user || user.userType !== 'Doctor') {
      navigate('/login/doctor');
    }
  }, [user, navigate]);

  // Only fetch data once when component mounts
  useEffect(() => {
    // Skip if not logged in or data already fetched
    if (!user || user.userType !== 'Doctor' || dataFetched.current) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch current doctor's data
        const doctorResponse = await apiClient.get('/doctors/me/');
        setCurrentDoctor(doctorResponse.data);

        // Fetch schedules and patients
        const [schedulesResponse, patientsResponse] = await Promise.all([
          apiClient.get('/schedules/'),
          apiClient.get('/patients/')
        ]);
        
        setSchedules(schedulesResponse.data);
        setPatients(patientsResponse.data);
        setLoading(false);
        dataFetched.current = true;
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
    
    // Clean up function
    return () => {
      dataFetched.current = false;
    };
  }, [user]); // Only depend on user, not activeTab

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (!user || user.userType !== 'Doctor') {
    return null;
  }

  if (loading) return <div className="loading-spinner">Loading doctor dashboard...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <div className="doctor-info">
          <div className="doctor-avatar">
            <i className="fas fa-user-md"></i>
          </div>
          <h3>Dr. {currentDoctor?.first_name || ''} {currentDoctor?.last_name || ''}</h3>
          <p>{currentDoctor?.specialization || 'Specialist'}</p>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={nav-item ${activeTab === 'profile' ? 'active' : ''}}
            onClick={() => handleTabChange('profile')}
          >
            <i className="fas fa-user-circle"></i> Profile
          </button>
          <button 
            className={nav-item ${activeTab === 'schedule' ? 'active' : ''}}
            onClick={() => handleTabChange('schedule')}
          >
            <i className="fas fa-calendar-alt"></i> Schedule
          </button>
          <button 
            className={nav-item ${activeTab === 'patients' ? 'active' : ''}}
            onClick={() => handleTabChange('patients')}
          >
            <i className="fas fa-users"></i> Patients
          </button>
          <button 
            className={nav-item ${activeTab === 'lab' ? 'active' : ''}}
            onClick={() => handleTabChange('lab')}
          >
            <i className="fas fa-flask"></i> Lab Tests
          </button>
        </nav>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'profile' && (
          <div className="dashboard-section">
            <h2>Doctor Profile</h2>
            <div className="doctor-profile-card">
              <div className="profile-info">
                <div className="info-group">
                  <label>Full Name:</label>
                  <p>Dr. {currentDoctor?.first_name || ''} {currentDoctor?.last_name || ''}</p>
                </div>
                <div className="info-group">
                  <label>Specialization:</label>
                  <p>{currentDoctor?.specialization || 'Not specified'}</p>
                </div>
                <div className="info-group">
                  <label>Department:</label>
                  <p>{currentDoctor?.department || 'Not specified'}</p>
                </div>
                <div className="info-group">
                  <label>Email:</label>
                  <p>{currentDoctor?.email || 'Not specified'}</p>
                </div>
                <div className="info-group">
                  <label>Contact:</label>
                  <p>{currentDoctor?.contact_number || 'Not specified'}</p>
                </div>
              </div>
              <button className="edit-profile-btn">
                <i className="fas fa-edit"></i> Edit Profile
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'schedule' && (
          <div className="dashboard-section">
            <h2>My Schedule</h2>
            {schedules.length === 0 ? (
              <p>No scheduled appointments found.</p>
            ) : (
              <div className="schedule-container">
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date & Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map(appointment => (
                        <tr key={appointment.appointment_id}>
                          <td>{appointment.patient_name}</td>
                          <td>{new Date(appointment.appointment_date).toLocaleString()}</td>
                          <td>{appointment.reason}</td>
                          <td>
                            <span className={status-badge status-${appointment.status.toLowerCase()}}>
                              {appointment.status}
                            </span>
                          </td>
                          <td>
                            <button className="action-btn view-btn">
                              <i className="fas fa-eye"></i>
                            </button>
                            <button className="action-btn edit-btn">
                              <i className="fas fa-edit"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'patients' && (
          <div className="dashboard-section">
            <h2>My Patients</h2>
            {patients.length === 0 ? (
              <p>No patients found.</p>
            ) : (
              <div className="patients-grid">
                {patients.map(patient => (
                  <div className="patient-card" key={patient.patient_id}>
                    <div className="patient-header">
                      <div className="patient-avatar">
                        <i className="fas fa-user"></i>
                      </div>
                      <div className="patient-name">
                        <h3>{patient.first_name} {patient.last_name}</h3>
                        <p>ID: {patient.reg_num}</p>
                      </div>
                    </div>
                    <div className="patient-details">
                      <div className="detail-item">
                        <i className="fas fa-envelope"></i>
                        <span>{patient.email || 'No email'}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-phone"></i>
                        <span>{patient.contact_number || 'No contact'}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-venus-mars"></i>
                        <span>{patient.gender || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="patient-actions">
                      <button className="patient-btn">View Details</button>
                      <button className="patient-btn">Schedule Appointment</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'lab' && (
          <div className="dashboard-section">
            <h2>Lab Tests</h2>
            <div className="lab-section">
              <button className="new-lab-btn">
                <i className="fas fa-plus"></i> Order New Lab Test
              </button>
              
              <h3>Recent Lab Test Orders</h3>
              <p>No lab tests have been ordered yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
