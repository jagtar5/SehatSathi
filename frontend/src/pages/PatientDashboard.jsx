import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import AppointmentForm from '../components/forms/AppointmentForm';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/Dashboard.css';

const PatientDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Selected item for viewing/editing
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [deleteAction, setDeleteAction] = useState(null);
  
  const navigate = useNavigate();

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all necessary data for the patient dashboard
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if the user is authenticated
      const userResponse = await apiClient.get('/current-user/');
      
      if (!userResponse.data || userResponse.data.userType !== 'Patient') {
        // Redirect to login if not authenticated as a patient
        navigate('/login');
        return;
      }
      
      // Fetch patient profile
      const patientProfileResponse = await apiClient.get('/patients/');
      
      // Find the current patient's profile
      const patientProfile = patientProfileResponse.data.find(
        profile => profile.user_details.id === userResponse.data.id
      );
      
      if (patientProfile) {
        setProfile(patientProfile);
        
        // Fetch patient appointments
        const appointmentsResponse = await apiClient.get('/appointments/');
        setAppointments(appointmentsResponse.data || []);
        
        // Fetch medical records
        const medicalRecordsResponse = await apiClient.get('/medical-records/');
        setMedicalRecords(medicalRecordsResponse.data || []);
        
        // Fetch lab test orders
        const labTestsResponse = await apiClient.get('/lab-tests/');
        setLabTests(labTestsResponse.data || []);
        
        // Fetch doctors for appointment scheduling
        const doctorsResponse = await apiClient.get('/doctors/');
        setDoctors(doctorsResponse.data || []);
      } else {
        setError('Patient profile not found. Please contact support.');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updatedProfile) => {
    try {
      await apiClient.patch(`/patients/${profile.id}/`, updatedProfile);
      setShowEditProfileModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    }
  };

  // Handle appointment booking
  const handleAppointmentSubmit = async (appointmentData) => {
    try {
      if (modalMode === 'add') {
        await apiClient.post('/appointments/', appointmentData);
      } else if (modalMode === 'edit') {
        await apiClient.patch(`/appointments/${selectedItem.id}/`, appointmentData);
      }
      setShowAppointmentModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error with appointment:', err);
      alert(`An error occurred: ${err.message || 'Unknown error'}`);
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = (appointment) => {
    setSelectedItem(appointment);
    setDeleteAction(() => async () => {
      try {
        await apiClient.patch(`/appointments/${appointment.id}/cancel/`, {});
        fetchData(); // Refresh data
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        alert(`Failed to cancel appointment: ${err.message || 'Unknown error'}`);
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  // Handle viewing medical record details
  const handleViewMedicalRecord = (record) => {
    setSelectedItem(record);
    setShowMedicalRecordModal(true);
  };

  // Handle viewing lab test details
  const handleViewLabTest = (test) => {
    setSelectedItem(test);
    setShowLabTestModal(true);
  };

  // Handle booking a new appointment
  const handleBookAppointment = () => {
    setSelectedItem(null);
    setModalMode('add');
    setShowAppointmentModal(true);
  };

  // Handle editing profile
  const handleEditProfile = () => {
    setModalMode('edit');
    setShowEditProfileModal(true);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading your information...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="dashboard-container error">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchData} className="retry-btn">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  // Render patient dashboard
  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <header className="dashboard-header">
        <h1>Patient Dashboard</h1>
        {profile && (
          <div className="user-welcome">
            <p>Welcome, {profile.user_details.first_name} {profile.user_details.last_name}</p>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="fas fa-user-circle"></i> My Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <i className="fas fa-calendar-check"></i> Appointments
        </button>
        <button
          className={`tab-btn ${activeTab === 'medical-records' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical-records')}
        >
          <i className="fas fa-file-medical"></i> Medical Records
        </button>
        <button
          className={`tab-btn ${activeTab === 'lab-tests' ? 'active' : ''}`}
          onClick={() => setActiveTab('lab-tests')}
        >
          <i className="fas fa-flask"></i> Lab Tests
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>My Profile</h2>
              <button className="action-btn" onClick={handleEditProfile}>
                <i className="fas fa-edit"></i> Edit Profile
              </button>
            </div>
            <div className="profile-details">
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="profile-field">
                  <span className="field-label">Name:</span>
                  <span className="field-value">{profile.user_details.first_name} {profile.user_details.last_name}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Email:</span>
                  <span className="field-value">{profile.user_details.email}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Date of Birth:</span>
                  <span className="field-value">{profile.date_of_birth || 'Not provided'}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Contact Number:</span>
                  <span className="field-value">{profile.contact_number || 'Not provided'}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Address:</span>
                  <span className="field-value">{profile.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>My Appointments</h2>
              <button className="action-btn primary" onClick={handleBookAppointment}>
                <i className="fas fa-plus"></i> Book Appointment
              </button>
            </div>
            
            {appointments.length === 0 ? (
              <div className="no-data-message">
                <p>You don't have any appointments. Book one to get started.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Date & Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(appointment => (
                      <tr key={appointment.id} className={`status-${appointment.status.toLowerCase()}`}>
                        <td>{appointment.doctor_details.first_name} {appointment.doctor_details.last_name}</td>
                        <td>{new Date(appointment.appointment_datetime).toLocaleString()}</td>
                        <td>{appointment.reason}</td>
                        <td>
                          <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="action-btn view-btn" 
                            onClick={() => {
                              setSelectedItem(appointment);
                              setModalMode('view');
                              setShowAppointmentModal(true);
                            }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {appointment.status === 'REQUESTED' || appointment.status === 'SCHEDULED' ? (
                            <button 
                              className="action-btn delete-btn" 
                              onClick={() => handleCancelAppointment(appointment)}
                            >
                              <i className="fas fa-times"></i> Cancel
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Medical Records Tab */}
        {activeTab === 'medical-records' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Medical Records</h2>
            </div>
            
            {medicalRecords.length === 0 ? (
              <div className="no-data-message">
                <p>No medical records found.</p>
              </div>
            ) : (
              <div className="medical-records-grid">
                {medicalRecords.map(record => (
                  <div className="medical-record-card" key={record.id}>
                    <div className="record-header">
                      <h3>{record.record_type}</h3>
                      <span className="record-date">{new Date(record.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="record-doctor">
                      <i className="fas fa-user-md"></i> Dr. {record.doctor_details.first_name} {record.doctor_details.last_name}
                    </div>
                    <p className="record-description">{record.description.substring(0, 100)}...</p>
                    <div className="record-actions">
                      <button className="action-btn" onClick={() => handleViewMedicalRecord(record)}>
                        <i className="fas fa-eye"></i> View Details
                      </button>
                      {record.document && (
                        <a 
                          href={record.document} 
                          className="action-btn download-btn" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <i className="fas fa-download"></i> Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lab Tests Tab */}
        {activeTab === 'lab-tests' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Lab Tests</h2>
            </div>
            
            {labTests.length === 0 ? (
              <div className="no-data-message">
                <p>No lab tests found.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Test Name</th>
                      <th>Ordered By</th>
                      <th>Order Date</th>
                      <th>Status</th>
                      <th>Results</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labTests.map(test => (
                      <tr key={test.id} className={`status-${test.status.toLowerCase()}`}>
                        <td>{test.test_name}</td>
                        <td>Dr. {test.ordered_by_doctor_details?.first_name} {test.ordered_by_doctor_details?.last_name}</td>
                        <td>{new Date(test.order_datetime).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${test.status.toLowerCase()}`}>
                            {test.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          {test.status === 'COMPLETED' ? (
                            <span>{test.result_summary ? 'Available' : 'Not available'}</span>
                          ) : (
                            <span>Pending</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="action-btn view-btn" 
                            onClick={() => handleViewLabTest(test)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                          {test.result_document && (
                            <a 
                              href={test.result_document} 
                              className="action-btn download-btn" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <i className="fas fa-download"></i>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <Modal 
          title="Edit Profile" 
          onClose={() => setShowEditProfileModal(false)}
        >
          <div className="form-container">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const updatedProfile = {
                date_of_birth: formData.get('date_of_birth'),
                address: formData.get('address'),
                contact_number: formData.get('contact_number')
              };
              handleProfileUpdate(updatedProfile);
            }}>
              <div className="form-group">
                <label htmlFor="date_of_birth">Date of Birth</label>
                <input 
                  type="date" 
                  name="date_of_birth" 
                  id="date_of_birth" 
                  defaultValue={profile.date_of_birth || ''}
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea 
                  name="address" 
                  id="address" 
                  rows="3" 
                  defaultValue={profile.address || ''}
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="contact_number">Contact Number</label>
                <input 
                  type="tel" 
                  name="contact_number" 
                  id="contact_number" 
                  defaultValue={profile.contact_number || ''}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <Modal 
          title={modalMode === 'add' ? 'Book Appointment' : 'Appointment Details'} 
          onClose={() => setShowAppointmentModal(false)}
        >
          <AppointmentForm 
            appointment={selectedItem} 
            doctors={doctors}
            onSubmit={handleAppointmentSubmit} 
            onCancel={() => setShowAppointmentModal(false)} 
            readOnly={modalMode === 'view'}
          />
        </Modal>
      )}

      {/* Medical Record Modal */}
      {showMedicalRecordModal && selectedItem && (
        <Modal 
          title="Medical Record Details" 
          onClose={() => setShowMedicalRecordModal(false)}
        >
          <div className="medical-record-details">
            <div className="detail-group">
              <h3>Record Type</h3>
              <p>{selectedItem.record_type}</p>
            </div>
            <div className="detail-group">
              <h3>Doctor</h3>
              <p>Dr. {selectedItem.doctor_details.first_name} {selectedItem.doctor_details.last_name}</p>
              <p><i>{selectedItem.doctor_details.specialization}</i></p>
            </div>
            <div className="detail-group">
              <h3>Date</h3>
              <p>{new Date(selectedItem.created_at).toLocaleString()}</p>
            </div>
            <div className="detail-group">
              <h3>Description</h3>
              <p className="medical-record-full-text">{selectedItem.description}</p>
            </div>
            {selectedItem.document && (
              <div className="detail-group">
                <h3>Document</h3>
                <a 
                  href={selectedItem.document} 
                  className="action-btn download-btn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-download"></i> Download Document
                </a>
              </div>
            )}
            <div className="form-actions">
              <button 
                className="btn-primary" 
                onClick={() => setShowMedicalRecordModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lab Test Modal */}
      {showLabTestModal && selectedItem && (
        <Modal 
          title="Lab Test Details" 
          onClose={() => setShowLabTestModal(false)}
        >
          <div className="lab-test-details">
            <div className="detail-group">
              <h3>Test Name</h3>
              <p>{selectedItem.test_name}</p>
            </div>
            <div className="detail-group">
              <h3>Ordered By</h3>
              <p>Dr. {selectedItem.ordered_by_doctor_details?.first_name} {selectedItem.ordered_by_doctor_details?.last_name}</p>
            </div>
            <div className="detail-group">
              <h3>Order Date</h3>
              <p>{new Date(selectedItem.order_datetime).toLocaleString()}</p>
            </div>
            <div className="detail-group">
              <h3>Status</h3>
              <p className={`status-badge ${selectedItem.status.toLowerCase()}`}>
                {selectedItem.status.replace('_', ' ')}
              </p>
            </div>
            {selectedItem.status === 'COMPLETED' && selectedItem.result_summary && (
              <div className="detail-group">
                <h3>Results Summary</h3>
                <p className="lab-test-full-text">{selectedItem.result_summary}</p>
              </div>
            )}
            {selectedItem.notes_by_doctor && (
              <div className="detail-group">
                <h3>Doctor's Notes</h3>
                <p className="lab-test-full-text">{selectedItem.notes_by_doctor}</p>
              </div>
            )}
            {selectedItem.result_document && (
              <div className="detail-group">
                <h3>Result Document</h3>
                <a 
                  href={selectedItem.result_document} 
                  className="action-btn download-btn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-download"></i> Download Results
                </a>
              </div>
            )}
            <div className="form-actions">
              <button 
                className="btn-primary" 
                onClick={() => setShowLabTestModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          title="Cancel Appointment"
          message="Are you sure you want to cancel this appointment? This action cannot be undone."
          confirmLabel="Yes, Cancel"
          cancelLabel="No, Keep It"
          onConfirm={deleteAction}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
    </div>
  );
};

export default PatientDashboard; 