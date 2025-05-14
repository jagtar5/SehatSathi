import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AuthService from '../services/AuthService';
import Modal from '../components/Modal';
import AppointmentForm from '../components/forms/AppointmentForm';
import LabTestForm from '../components/forms/LabTestForm';
import ScheduleForm from '../components/forms/ScheduleForm';
import '../styles/Dashboard.css';

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataInitialized, setDataInitialized] = useState(false);
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const dataFetched = useRef(false);
  
  // State for appointment form modal
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentModalMode, setAppointmentModalMode] = useState('view');
  
  // State for profile editing
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);

  // Add state for lab test form modal
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [selectedPatientForLabTest, setSelectedPatientForLabTest] = useState(null);
  const [labTests, setLabTests] = useState([]);
  
  // State for patient details modal
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);

  // State for schedule management
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleModalMode, setScheduleModalMode] = useState('add');

  // Check if user is logged in and has doctor role
  useEffect(() => {
    if (!user || user.userType !== 'Doctor') {
      navigate('/login/doctor');
    }
  }, [user, navigate]);

  // Initialize default doctor profile data
  const initializeDefaultDoctorData = (userData) => {
    return {
      first_name: userData?.username || "",
      last_name: "",
      specialization: "General Medicine",
      department: "General",
      email: userData?.email || "",
      contact_number: "",
      doctor_id: userData?.doctorId || 0
    };
  };

  // Only fetch data once when component mounts
  useEffect(() => {
    // Skip if not logged in
    if (!user || user.userType !== 'Doctor') {
      return;
    }

    const fetchData = async () => {
      if (dataFetched.current) return;
      
      setLoading(true);
      setError(null);
      dataFetched.current = true;
      
      try {
        console.log("Fetching data for doctor:", user);
        // Initialize with default data in case API calls fail
        const defaultDoctorData = initializeDefaultDoctorData(user);
        setProfileData(defaultDoctorData);
        
        // Fetch all data at once with error handling for each request
        const doctorsResponse = await apiClient.get('/doctors/').catch(err => {
          console.error("Error fetching doctors:", err);
          return { data: [] };
        });
        
        const patientsResponse = await apiClient.get('/patients/').catch(err => {
          console.error("Error fetching patients:", err);
          return { data: [] };
        });
        
        const labTestsResponse = await apiClient.get('/lab-tests/').catch(err => {
          console.error("Error fetching lab tests:", err);
          return { data: [] };
        });
        
        // Set the fetched data to state
        setDoctors(doctorsResponse.data || []);
        // We'll filter patients after we get the appointments
        
        // Find current doctor with more robust matching
        let doctorId = user?.doctorId;
        let currentDoctor = null;

        if (doctorsResponse.data && doctorsResponse.data.length > 0) {
          currentDoctor = doctorsResponse.data.find(d => {
            // Try to match by doctorId first
            if (user?.doctorId && d.doctor_id === user.doctorId) {
              return true;
            }
            
            // Try to match by user.id
            if (d.user && user?.id && d.user.id === user.id) {
              return true;
            }
            
            // Try to match by username
            if (d.user && d.user.username && user?.username && 
                d.user.username.toLowerCase() === user.username.toLowerCase()) {
              return true;
            }
            
            // Fallback to matching by name
            return (d.first_name && user?.username && 
                d.first_name.toLowerCase() === user.username.toLowerCase());
          });
        }
        
        // If we found a doctor profile, use it; otherwise use the default
        if (currentDoctor) {
          console.log("Found doctor profile:", currentDoctor);
          doctorId = currentDoctor.doctor_id;
          setProfileData(currentDoctor);
        } else {
          console.warn("No matching doctor profile found for:", user?.username);
          // Keep using the default profile data initialized earlier
        }
        
        // Fetch schedules/appointments with doctor ID if available
        let schedulesData = [];
        try {
          if (doctorId) {
            const schedulesResponse = await apiClient.get(`/schedules/?doctor=${doctorId}`);
            schedulesData = schedulesResponse.data || [];
            
            // Also fetch doctor's available time slots
            try {
              const doctorSchedulesResponse = await apiClient.get(`/doctor-schedules/?doctor=${doctorId}`);
              setDoctorSchedules(doctorSchedulesResponse.data || []);
            } catch (scheduleError) {
              console.error("Error fetching doctor schedules:", scheduleError);
              setDoctorSchedules([]);
            }
          } else {
            // Fallback: try to fetch all schedules and filter by doctor name if no ID available
            const allSchedulesResponse = await apiClient.get('/schedules/');
            const allSchedules = allSchedulesResponse.data || [];
            
            // Try to filter by doctor name as fallback
            if (user?.username) {
              schedulesData = allSchedules.filter(s => 
                s.doctor_name?.toLowerCase()?.includes(user.username.toLowerCase())
              );
            }
          }
          
          // Validate and sanitize each appointment to prevent data corruption
          const sanitizedSchedules = schedulesData.map(appointment => {
            // Ensure all required fields have at least default values
            return {
              appointment_id: appointment.appointment_id || `temp-${Date.now()}`,
              patient_name: appointment.patient_name || 'Unknown Patient',
              appointment_date: appointment.appointment_date || new Date().toISOString(),
              reason: appointment.reason || 'Not specified',
              status: appointment.status || 'Scheduled',
              patient_id: appointment.patient_id || 0,
              doctor_id: appointment.doctor_id || doctorId || 0,
              ...appointment
            };
          });
          
          setSchedules(sanitizedSchedules);
          
          // Now filter patients to only show those who have appointments with this doctor
          const patientIdsWithAppointments = new Set(
            sanitizedSchedules.map(appointment => appointment.patient_id)
          );
          
          // Filter the patients array to only include patients with appointments
          const filteredPatients = (patientsResponse.data || []).filter(patient => 
            patientIdsWithAppointments.has(patient.patient_id)
          );
          
          setPatients(filteredPatients);
        } catch (scheduleErr) {
          console.error("Error fetching schedules:", scheduleErr);
          setSchedules([]);
          setPatients([]);
        }
        
        // Set lab tests with proper filtering and validation
        if (labTestsResponse.data && labTestsResponse.data.length > 0) {
          let filteredTests = labTestsResponse.data;
          
          if (doctorId) {
            filteredTests = labTestsResponse.data.filter(test => 
              test.doctor === doctorId || 
              test.doctor_id === doctorId
            );
          } else if (user?.username) {
            // Fallback: filter by doctor name if ID not available
            filteredTests = labTestsResponse.data.filter(test => 
              test.doctor_name?.toLowerCase()?.includes(user.username.toLowerCase())
            );
          }
          
          // Sanitize lab test data
          const sanitizedTests = filteredTests.map(test => {
            return {
              id: test.id || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              test_name: test.test_name || 'Unknown Test',
              patient_name: test.patient_name || 'Unknown Patient',
              requested_at: test.requested_at || new Date().toISOString(),
              status: test.status || 'pending',
              ...test
            };
          });
          
          setLabTests(sanitizedTests);
        }
        
        setDataInitialized(true);
        setLoading(false);
      } catch (err) {
        console.error("Critical error in dashboard data fetching:", err);
        setError(`Failed to load data. ${err.message || 'Please try again.'}`);
        setLoading(false);
        
        // Even on error, initialize with minimal data to prevent blank screen
        setDataInitialized(true);
      }
    };

    fetchData();
  }, [user]); // Only depend on user

  // Find current doctor data with more robust matching
  const currentDoctor = doctors.find(d => {
    // First try to match by doctorId from user object
    if (user?.doctorId && d.doctor_id === user.doctorId) {
      return true;
    }
    
    // Then try to match by user.id if doctor has user field
    if (d.user && user?.id && d.user.id === user.id) {
      return true;
    }
    
    // Try to match by username
    if (d.user && d.user.username && user?.username) {
      return d.user.username.toLowerCase() === user.username.toLowerCase();
    }
    
    // Fallback to matching by name
    return (d.first_name && user?.username && 
      d.first_name.toLowerCase() === user.username.toLowerCase());
  }) || profileData;

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle viewing an appointment
  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentModalMode('view');
    setShowAppointmentModal(true);
  };
  
  // Handle ordering a new lab test
  const handleOrderLabTest = (patient = null) => {
    // If patient is null and we're in the lab tab, show patient selection first
    if (!patient) {
      // Only allow selecting from patients with appointments
      if (patients.length === 0) {
        alert("You don't have any assigned patients. You can only order lab tests for patients with appointments.");
        return;
      }
    }
    setSelectedPatientForLabTest(patient);
    setShowLabTestModal(true);
  };
  
  // Handle lab test form submission
  const handleLabTestSubmit = (labTestData) => {
    // Add the new lab test to the list
    const newTest = {
      ...labTestData,
      id: labTestData.id || `new-${Date.now()}`,
      requested_at: labTestData.requested_at || new Date().toISOString(),
      status: labTestData.status || 'pending'
    };
    
    setLabTests([...labTests, newTest]);
    setShowLabTestModal(false);
  };

  // Handle viewing patient details
  const handleViewPatientDetails = (patient) => {
    setSelectedPatientDetails(patient);
    setShowPatientDetailsModal(true);
  };
  
  // Handle editing doctor profile
  const handleEditProfile = () => {
    // Make sure we have valid profile data
    const dataToEdit = { ...currentDoctor };
    
    // Set defaults for missing values to prevent uncontrolled component warnings
    if (!dataToEdit.first_name) dataToEdit.first_name = user?.username || "";
    if (!dataToEdit.last_name) dataToEdit.last_name = "";
    if (!dataToEdit.specialization) dataToEdit.specialization = "";
    if (!dataToEdit.department) dataToEdit.department = "";
    if (!dataToEdit.email) dataToEdit.email = user?.email || "";
    if (!dataToEdit.contact_number) dataToEdit.contact_number = "";
    
    setProfileData(dataToEdit);
    setShowProfileModal(true);
  };
  
  // Handle profile form changes
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setEditingProfile(true);
    
    try {
      let response;
      const submissionData = { ...profileData };
      
      // Make sure we have a doctor_id
      if (!submissionData.doctor_id && user?.doctorId) {
        submissionData.doctor_id = user.doctorId;
      }
      
      // If we have a doctor_id, update the existing profile, otherwise create a new one
      if (submissionData.doctor_id) {
        response = await apiClient.put(`/doctors/${submissionData.doctor_id}/`, submissionData);
        console.log("Updated doctor profile:", response.data);
      } else {
        // Create a new doctor profile if we don't have an ID
        response = await apiClient.post(`/doctors/`, submissionData);
        console.log("Created new doctor profile:", response.data);
      }
      
      // Update the doctors array and current doctor data
      if (response && response.data) {
        // If the doctor already exists in the array, update it; otherwise add it
        const updatedDoctors = response.data.doctor_id && doctors.some(d => d.doctor_id === response.data.doctor_id)
          ? doctors.map(d => d.doctor_id === response.data.doctor_id ? response.data : d)
          : [...doctors, response.data];
        
        setDoctors(updatedDoctors);
        setProfileData(response.data);
        
        // Also update the user object with the doctor_id if not already set
        if (response.data.doctor_id && !user.doctorId) {
          const updatedUser = { ...user, doctorId: response.data.doctor_id };
          AuthService.setCurrentUser(updatedUser);
        }
      }
      
      setEditingProfile(false);
      setShowProfileModal(false);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      setEditingProfile(false);
      alert('Failed to update profile. Please try again.');
    }
  };

  // Add new handler for adding a schedule
  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setScheduleModalMode('add');
    setShowScheduleModal(true);
  };

  // Add new handler for editing a schedule
  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleModalMode('edit');
    setShowScheduleModal(true);
  };

  // Add new handler for deleting a schedule
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

  // Add new handler for submitting a schedule
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

  // If not logged in as a doctor, redirect to login
  if (!user || user.userType !== 'Doctor') {
    return null;
  }

  // Show loading indicator
  if (loading && !dataInitialized) {
    return <div className="loading-spinner">Loading doctor dashboard...</div>;
  }

  // Show error message if there was a problem
  if (error && !dataInitialized) {
    return (
      <div className="error-message">
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => {
            dataFetched.current = false;
            setLoading(true);
            setError(null);
            window.location.reload();
          }}
          className="edit-profile-btn"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Ensure we have at least some data to display
  const doctorName = currentDoctor?.first_name || user?.username || 'Doctor';
  const doctorSpecialty = currentDoctor?.specialization || 'General Medicine';

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <div className="doctor-info">
          <div className="doctor-avatar">
            <i className="fas fa-user-md"></i>
          </div>
          <h3>Dr. {doctorName} {currentDoctor?.last_name || ''}</h3>
          <p>{doctorSpecialty}</p>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <i className="fas fa-user-circle"></i> Profile
          </button>
          <button 
            className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => handleTabChange('schedule')}
          >
            <i className="fas fa-calendar-alt"></i> Schedule
          </button>
          <button 
            className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => handleTabChange('patients')}
          >
            <i className="fas fa-users"></i> Patients
          </button>
          <button 
            className={`nav-item ${activeTab === 'lab' ? 'active' : ''}`}
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
                  <p>Dr. {doctorName} {currentDoctor?.last_name || ''}</p>
                </div>
                <div className="info-group">
                  <label>Specialization:</label>
                  <p>{doctorSpecialty}</p>
                </div>
                <div className="info-group">
                  <label>Department:</label>
                  <p>{currentDoctor?.department || 'General'}</p>
                </div>
                <div className="info-group">
                  <label>Email:</label>
                  <p>{currentDoctor?.email || currentDoctor?.user?.email || user?.email || 'Not specified'}</p>
                </div>
                <div className="info-group">
                  <label>Contact:</label>
                  <p>{currentDoctor?.contact_number || 'Not specified'}</p>
                </div>
              </div>
              <button className="edit-profile-btn" onClick={handleEditProfile}>
                <i className="fas fa-edit"></i> Edit Profile
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'schedule' && (
          <div className="dashboard-section">
            <div className="section-header">
            <h2>My Schedule</h2>
              <button className="new-item-btn" onClick={handleAddSchedule}>
                <i className="fas fa-plus"></i> Add Availability
              </button>
            </div>
            
            <div className="schedule-management">
              <h3>My Availability</h3>
              {doctorSchedules.length === 0 ? (
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
                      {doctorSchedules.map(schedule => {
                        // Format day of week for display
                        const day = schedule.day_of_week.charAt(0).toUpperCase() + schedule.day_of_week.slice(1);
                        
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
                          <tr key={schedule.schedule_id || `schedule-${Math.random()}`}>
                            <td>{day}</td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="schedule-appointments">
              <h3>Upcoming Appointments</h3>
              {loading ? (
                <p>Loading schedule data...</p>
              ) : schedules.length === 0 ? (
              <p>No scheduled appointments found.</p>
            ) : (
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
                      {schedules.map(appointment => {
                        // Ensure appointment has valid data
                        const appointmentDate = appointment.appointment_date ? 
                          new Date(appointment.appointment_date) : new Date();
                        
                        // Check if date is valid
                        const dateStr = isNaN(appointmentDate.getTime()) ? 
                          'Invalid date' : appointmentDate.toLocaleString();
                        
                        const status = appointment.status || 'Scheduled';
                        
                        return (
                          <tr key={appointment.appointment_id || `appt-${Math.random()}`}>
                            <td>{appointment.patient_name || 'Unknown'}</td>
                            <td>{dateStr}</td>
                            <td>{appointment.reason || 'Not specified'}</td>
                          <td>
                              <span className={`status-badge status-${status.toLowerCase()}`}>
                                {status}
                            </span>
                          </td>
                          <td>
                              <button 
                                className="action-btn view-btn" 
                                onClick={() => handleViewAppointment(appointment)}
                              >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
          </div>
        )}
        
        {activeTab === 'patients' && (
          <div className="dashboard-section">
            <h2>My Patients</h2>
            <div className="info-message">
              <i className="fas fa-info-circle"></i> You can only see patients who have appointments with you.
            </div>
            {loading ? (
              <p>Loading patient data...</p>
            ) : patients.length === 0 ? (
              <p>No patients found. Patients will appear here when they make appointments with you.</p>
            ) : (
              <div className="patients-grid">
                {patients.map(patient => (
                  <div className="patient-card" key={patient.patient_id || `patient-${Math.random()}`}>
                    <div className="patient-header">
                      <div className="patient-avatar">
                        <i className="fas fa-user"></i>
                      </div>
                      <div className="patient-name">
                        <h3>{patient.first_name || ''} {patient.last_name || ''}</h3>
                        <p>ID: {patient.reg_num || 'Not assigned'}</p>
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
                      <button 
                        className="patient-btn"
                        onClick={() => handleViewPatientDetails(patient)}
                      >
                        View Details
                      </button>
                      <button 
                        className="patient-btn"
                        onClick={() => handleOrderLabTest(patient)}
                      >
                        Order Lab Test
                      </button>
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
              <button 
                className="new-lab-btn"
                onClick={() => handleOrderLabTest()}
              >
                <i className="fas fa-plus"></i> Order New Lab Test
              </button>
              
              <h3>Recent Lab Test Orders</h3>
              {loading ? (
                <p>Loading lab test data...</p>
              ) : labTests.length === 0 ? (
              <p>No lab tests have been ordered yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Test Name</th>
                        <th>Requested Date</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labTests.map((test, index) => {
                        const requestDate = test.requested_at ? 
                          new Date(test.requested_at) : new Date();
                        
                        // Check if date is valid
                        const dateStr = isNaN(requestDate.getTime()) ? 
                          'Invalid date' : requestDate.toLocaleDateString();
                          
                        const status = test.status || 'pending';
                        const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
                        
                        return (
                          <tr key={test.id || `test-${index}`}>
                            <td>{test.patient_name || 'Unknown'}</td>
                            <td>{test.test_name || 'General test'}</td>
                            <td>{dateStr}</td>
                            <td>
                              <span className={`status-badge status-${status}`}>
                                {statusDisplay}
                              </span>
                            </td>
                            <td>{test.notes || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Profile Edit Modal */}
      {showProfileModal && (
        <Modal
          title="Edit Doctor Profile"
          onClose={() => setShowProfileModal(false)}
        >
          <form className="modal-form" onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="first_name">First Name*</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={profileData.first_name || ''}
                onChange={handleProfileInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="last_name">Last Name*</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={profileData.last_name || ''}
                onChange={handleProfileInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="specialization">Specialization*</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={profileData.specialization || ''}
                onChange={handleProfileInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="department">Department*</label>
              <input
                type="text"
                id="department"
                name="department"
                value={profileData.department || ''}
                onChange={handleProfileInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email || ''}
                onChange={handleProfileInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contact_number">Contact Number*</label>
              <input
                type="text"
                id="contact_number"
                name="contact_number"
                value={profileData.contact_number || ''}
                onChange={handleProfileInputChange}
                required
              />
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setShowProfileModal(false)}
                disabled={editingProfile}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={editingProfile}
              >
                {editingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      
      {/* Appointment Modal */}
      {showAppointmentModal && (
        <Modal
          title="View Appointment"
          onClose={() => setShowAppointmentModal(false)}
        >
          <AppointmentForm
            appointment={selectedAppointment}
            onSubmit={() => setShowAppointmentModal(false)}
            onCancel={() => setShowAppointmentModal(false)}
            readOnly={true}
          />
        </Modal>
      )}
      
      {/* Patient Details Modal */}
      {showPatientDetailsModal && selectedPatientDetails && (
        <Modal
          title="Patient Details"
          onClose={() => setShowPatientDetailsModal(false)}
          size="large"
        >
          <div className="patient-details-modal">
            <div className="patient-header-section">
              <div className="patient-avatar-large">
                <i className="fas fa-user"></i>
              </div>
              <div className="patient-name-section">
                <h3>{selectedPatientDetails.first_name || ''} {selectedPatientDetails.last_name || ''}</h3>
                <span className="patient-id-badge">ID: {selectedPatientDetails.reg_num || 'Not assigned'}</span>
              </div>
            </div>

            <div className="patient-details-tabs">
              <div className="tabs-header">
                <h4>Personal Information</h4>
              </div>
              <div className="patient-info-grid">
                <div className="info-row">
                  <span className="info-label">Gender:</span>
                  <span className="info-value">{selectedPatientDetails.gender || 'Not specified'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date of Birth:</span>
                  <span className="info-value">
                    {selectedPatientDetails.date_of_birth ? new Date(selectedPatientDetails.date_of_birth).toLocaleDateString() : 'Not specified'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Contact:</span>
                  <span className="info-value">{selectedPatientDetails.contact_number || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{selectedPatientDetails.email || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{selectedPatientDetails.address || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Blood Type:</span>
                  <span className="info-value">{selectedPatientDetails.blood_group || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Lab Tests Section */}
            <div className="patient-details-tabs">
              <div className="tabs-header">
                <h4>Lab Tests</h4>
              </div>
              <div className="lab-tests-section">
                {labTests.filter(test => test.patient_id === selectedPatientDetails.patient_id || 
                                         test.patient === selectedPatientDetails.patient_id).length > 0 ? (
                  <table className="lab-tests-table">
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labTests
                        .filter(test => test.patient_id === selectedPatientDetails.patient_id || 
                                       test.patient === selectedPatientDetails.patient_id)
                        .map(test => (
                          <tr key={test.id}>
                            <td>{test.test_name}</td>
                            <td>{new Date(test.requested_at).toLocaleDateString()}</td>
                            <td>
                              <span className={`status-badge status-${test.status.toLowerCase()}`}>
                                {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                              </span>
                            </td>
                            <td>{test.notes || 'None'}</td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data-message">No lab tests ordered for this patient yet.</p>
                )}
              </div>
            </div>

            <div className="patient-actions">
              <button 
                className="patient-modal-btn" 
                onClick={() => {
                  handleOrderLabTest(selectedPatientDetails);
                  setShowPatientDetailsModal(false);
                }}
              >
                <i className="fas fa-flask"></i> Order Lab Test
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Lab Test Modal */}
      {showLabTestModal && (
        <Modal
          title="Order Lab Test"
          onClose={() => setShowLabTestModal(false)}
        >
          <LabTestForm
            onSubmit={handleLabTestSubmit}
            onCancel={() => setShowLabTestModal(false)}
            currentDoctor={profileData}
            preselectedPatient={selectedPatientForLabTest}
            availablePatients={patients}
          />
        </Modal>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <Modal
          title={scheduleModalMode === 'add' ? 'Add Availability' : 'Edit Availability'}
          onClose={() => setShowScheduleModal(false)}
        >
          <ScheduleForm
            schedule={selectedSchedule}
            currentDoctor={profileData}
            onSubmit={handleScheduleSubmit}
            onCancel={() => setShowScheduleModal(false)}
          />
        </Modal>
      )}
    </div>
  );
} 