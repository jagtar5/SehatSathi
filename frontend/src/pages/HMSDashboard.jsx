import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AuthService from '../services/AuthService';
import Modal from '../components/Modal';
import DoctorForm from '../components/forms/DoctorForm';
import PatientForm from '../components/forms/PatientForm';
import AppointmentForm from '../components/forms/AppointmentForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { runBackendDiagnostics } from '../utils/backendCheck';
import '../styles/Dashboard.css';

export default function HMSDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const dataFetched = useRef(false);
  
  // State for modals
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [deleteAction, setDeleteAction] = useState(null); // Function to call on confirm delete

  // Run diagnostics
  const [diagResults, setDiagResults] = useState(null);
  const [runningDiag, setRunningDiag] = useState(false);

  // Check if user is logged in and has admin role
  useEffect(() => {
    if (!user || user.userType !== 'Admin') {
      navigate('/login/admin');
    }
  }, [user, navigate]);

  // Only fetch data once when component mounts
  useEffect(() => {
    // Skip if not logged in or data already fetched
    if (!user || user.userType !== 'Admin' || dataFetched.current) {
      return;
    }

    fetchData();
    
    // Clean up function
    return () => {
      dataFetched.current = false;
    };
  }, [user]);

  // Function to fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data for the admin dashboard
      const [doctorsResponse, appointmentsResponse, patientsResponse] = await Promise.all([
        apiClient.get('/doctors/'),
        apiClient.get('/appointments/'),
        apiClient.get('/patients/')
      ]);
      
      setDoctors(doctorsResponse.data);
      setAppointments(appointmentsResponse.data);
      setPatients(patientsResponse.data);
      setLoading(false);
      dataFetched.current = true;
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
      console.error(err);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle adding a new doctor
  const handleAddDoctor = () => {
    setSelectedItem(null);
    setModalMode('add');
    setShowDoctorModal(true);
  };

  // Handle editing a doctor
  const handleEditDoctor = (doctor) => {
    setSelectedItem(doctor);
    setModalMode('edit');
    setShowDoctorModal(true);
  };

  // Handle doctor form submission
  const handleDoctorSubmit = (doctorData) => {
    if (modalMode === 'add') {
      setDoctors([...doctors, doctorData]);
    } else {
      setDoctors(doctors.map(d => d.doctor_id === doctorData.doctor_id ? doctorData : d));
    }
    setShowDoctorModal(false);
  };

  // View doctor details
  const handleViewDoctor = (doctor) => {
    setSelectedItem(doctor);
    setModalMode('view');
    setShowDoctorModal(true);
  };

  // Handle delete doctor
  const handleDeleteDoctor = (doctor) => {
    setSelectedItem(doctor);
    setDeleteAction(() => async () => {
      try {
        await apiClient.delete(`/doctors/${doctor.doctor_id}/`);
        setDoctors(doctors.filter(d => d.doctor_id !== doctor.doctor_id));
        setShowConfirmDialog(false);
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert('Failed to delete doctor. Please try again.');
      }
    });
    setShowConfirmDialog(true);
  };

  // Patient handling functions
  const handleAddPatient = () => {
    setSelectedItem(null);
    setModalMode('add');
    setShowPatientModal(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedItem(patient);
    setModalMode('edit');
    setShowPatientModal(true);
  };

  const handleViewPatient = (patient) => {
    setSelectedItem(patient);
    setModalMode('view');
    setShowPatientModal(true);
  };

  const handlePatientSubmit = (patientData) => {
    if (modalMode === 'add') {
      setPatients([...patients, patientData]);
    } else {
      setPatients(patients.map(p => p.patient_id === patientData.patient_id ? patientData : p));
    }
    setShowPatientModal(false);
  };

  const handleDeletePatient = (patient) => {
    setSelectedItem(patient);
    setDeleteAction(() => async () => {
      try {
        await apiClient.delete(`/patients/${patient.patient_id}/`);
        setPatients(patients.filter(p => p.patient_id !== patient.patient_id));
        setShowConfirmDialog(false);
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient. Please try again.');
      }
    });
    setShowConfirmDialog(true);
  };

  // Appointment handling functions
  const handleAddAppointment = () => {
    setSelectedItem(null);
    setModalMode('add');
    setShowAppointmentModal(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedItem(appointment);
    setModalMode('edit');
    setShowAppointmentModal(true);
  };

  const handleViewAppointment = (appointment) => {
    setSelectedItem(appointment);
    setModalMode('view');
    setShowAppointmentModal(true);
  };

  const handleAppointmentSubmit = (appointmentData) => {
    if (modalMode === 'add') {
      setAppointments([...appointments, appointmentData]);
    } else {
      setAppointments(appointments.map(a => a.appointment_id === appointmentData.appointment_id ? appointmentData : a));
    }
    setShowAppointmentModal(false);
  };

  const handleDeleteAppointment = (appointment) => {
    setSelectedItem(appointment);
    setDeleteAction(() => async () => {
      try {
        await apiClient.delete(`/appointments/${appointment.appointment_id}/`);
        setAppointments(appointments.filter(a => a.appointment_id !== appointment.appointment_id));
        setShowConfirmDialog(false);
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment. Please try again.');
      }
    });
    setShowConfirmDialog(true);
  };

  // Run diagnostics
  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    try {
      const results = await runBackendDiagnostics();
      setDiagResults(results);
      console.log('Diagnostics results:', results);
      
      if (results.connected) {
        alert(`Backend connection successful! ${results.existingData ? 
          `Found ${results.dataCounts.doctors} doctors and ${results.dataCounts.patients} patients.` : 
          'Created test data successfully.'}`);
        
        // Refresh data
        fetchData();
      } else {
        alert(`Backend connection failed: ${results.statusText}. The app will use mock data instead.`);
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
      alert('Error running diagnostics. Check console for details.');
    } finally {
      setRunningDiag(false);
    }
  };

  // Don't render anything if not authenticated
  if (!user || user.userType !== 'Admin') {
    return null;
  }

  // Dashboard stats for overview
  const dashboardStats = [
    { name: 'Total Doctors', value: doctors.length, icon: 'fa-user-md', color: 'blue' },
    { name: 'Total Patients', value: patients.length, icon: 'fa-users', color: 'green' },
    { name: 'Appointments', value: appointments.length, icon: 'fa-calendar-check', color: 'orange' },
    { name: 'Pending Appointments', 
      value: appointments.filter(a => a.status === 'Scheduled').length, 
      icon: 'fa-clock', 
      color: 'red' 
    },
  ];

  if (loading) return <div className="loading-spinner">Loading HMS dashboard...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <div className="admin-info">
          <div className="admin-avatar">
            <i className="fas fa-user-shield"></i>
          </div>
          <h3>Admin Dashboard</h3>
          <p>{user?.username || 'Administrator'}</p>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <i className="fas fa-chart-pie"></i> Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => handleTabChange('appointments')}
          >
            <i className="fas fa-calendar-alt"></i> Appointments
          </button>
          <button 
            className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => handleTabChange('doctors')}
          >
            <i className="fas fa-user-md"></i> Doctors
          </button>
          <button 
            className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => handleTabChange('patients')}
          >
            <i className="fas fa-users"></i> Patients
          </button>
        </nav>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="dashboard-section">
            <h2>Hospital Overview</h2>
            
            <div className="stats-grid">
              {dashboardStats.map((stat, index) => (
                <div className={`stat-card stat-${stat.color}`} key={index}>
                  <div className="stat-icon">
                    <i className={`fas ${stat.icon}`}></i>
                  </div>
                  <div className="stat-details">
                    <h3>{stat.value}</h3>
                    <p>{stat.name}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="overview-charts">
              <div className="chart-container">
                <h3>Recent Appointments</h3>
                <div className="recent-items">
                  {appointments.slice(0, 5).map(appointment => (
                    <div className="recent-item" key={appointment.appointment_id}>
                      <div className="recent-item-info">
                        <h4>{appointment.patient_name}</h4>
                        <p>with Dr. {appointment.doctor_name}</p>
                        <small>{new Date(appointment.appointment_date).toLocaleString()}</small>
                      </div>
                      <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="chart-container">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button className="quick-action-btn" onClick={handleAddDoctor}>
                    <i className="fas fa-plus-circle"></i>
                    Add New Doctor
                  </button>
                  <button className="quick-action-btn" onClick={handleAddPatient}>
                    <i className="fas fa-user-plus"></i>
                    Register Patient
                  </button>
                  <button className="quick-action-btn" onClick={handleAddAppointment}>
                    <i className="fas fa-calendar-plus"></i>
                    Schedule Appointment
                  </button>
                  <button className="quick-action-btn" onClick={handleRunDiagnostics} disabled={runningDiag}>
                    <i className="fas fa-tools"></i>
                    {runningDiag ? 'Running Diagnostics...' : 'Run Diagnostics'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'appointments' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>All Appointments</h2>
              <button className="new-item-btn" onClick={handleAddAppointment}>
                <i className="fas fa-plus"></i> New Appointment
              </button>
            </div>
            
            {appointments.length === 0 ? (
              <p>No appointments found.</p>
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date & Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(appointment => (
                      <tr key={appointment.appointment_id}>
                        <td>{appointment.appointment_id}</td>
                        <td>{appointment.patient_name}</td>
                        <td>{appointment.doctor_name}</td>
                        <td>{new Date(appointment.appointment_date).toLocaleString()}</td>
                        <td>{appointment.reason}</td>
                        <td>
                          <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn view-btn" onClick={() => handleViewAppointment(appointment)}>
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="action-btn edit-btn" onClick={() => handleEditAppointment(appointment)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="action-btn delete-btn" onClick={() => handleDeleteAppointment(appointment)}>
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
        )}
        
        {activeTab === 'doctors' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>All Doctors</h2>
              <button className="new-item-btn" onClick={handleAddDoctor}>
                <i className="fas fa-plus"></i> Add Doctor
              </button>
            </div>
            
            {doctors.length === 0 ? (
              <p>No doctors found.</p>
            ) : (
              <div className="doctors-grid">
                {doctors.map(doctor => (
                  <div className="doctor-card" key={doctor.doctor_id}>
                    <div className="doctor-avatar">
                      <i className="fas fa-user-md"></i>
                    </div>
                    <h3>Dr. {doctor.first_name} {doctor.last_name}</h3>
                    <p className="doctor-specialty">{doctor.specialization}</p>
                    <p className="doctor-department">{doctor.department}</p>
                    <div className="doctor-contact">
                      <div><i className="fas fa-envelope"></i> {doctor.email}</div>
                      <div><i className="fas fa-phone"></i> {doctor.contact_number || 'N/A'}</div>
                    </div>
                    <div className="doctor-actions">
                      <button className="doctor-btn" onClick={() => handleViewDoctor(doctor)}>View Profile</button>
                      <button className="doctor-btn" onClick={() => handleEditDoctor(doctor)}>Edit</button>
                      <button className="doctor-btn delete" onClick={() => handleDeleteDoctor(doctor)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'patients' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>All Patients</h2>
              <button className="new-item-btn" onClick={handleAddPatient}>
                <i className="fas fa-plus"></i> Register Patient
              </button>
            </div>
            
            {patients.length === 0 ? (
              <p>No patients found.</p>
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Date of Birth</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(patient => (
                      <tr key={patient.patient_id}>
                        <td>{patient.reg_num}</td>
                        <td>{patient.first_name} {patient.last_name}</td>
                        <td>{patient.gender}</td>
                        <td>{new Date(patient.date_of_birth).toLocaleDateString()}</td>
                        <td>{patient.contact_number || 'N/A'}</td>
                        <td>{patient.email}</td>
                        <td>
                          <button className="action-btn view-btn" onClick={() => handleViewPatient(patient)}>
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="action-btn edit-btn" onClick={() => handleEditPatient(patient)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="action-btn delete-btn" onClick={() => handleDeletePatient(patient)}>
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
        )}
      </div>

      {/* Doctor Modal */}
      <Modal 
        isOpen={showDoctorModal} 
        onClose={() => setShowDoctorModal(false)} 
        title={modalMode === 'add' ? 'Add New Doctor' : modalMode === 'edit' ? 'Edit Doctor' : 'Doctor Details'}
      >
        <DoctorForm 
          doctor={selectedItem} 
          onSubmit={handleDoctorSubmit} 
          onCancel={() => setShowDoctorModal(false)} 
        />
      </Modal>

      {/* Patient Modal */}
      <Modal 
        isOpen={showPatientModal} 
        onClose={() => setShowPatientModal(false)} 
        title={modalMode === 'add' ? 'Register New Patient' : modalMode === 'edit' ? 'Edit Patient' : 'Patient Details'}
      >
        <PatientForm 
          patient={selectedItem} 
          onSubmit={handlePatientSubmit} 
          onCancel={() => setShowPatientModal(false)} 
        />
      </Modal>

      {/* Appointment Modal */}
      <Modal 
        isOpen={showAppointmentModal} 
        onClose={() => setShowAppointmentModal(false)} 
        title={modalMode === 'add' ? 'Schedule New Appointment' : modalMode === 'edit' ? 'Edit Appointment' : 'Appointment Details'}
      >
        <AppointmentForm 
          appointment={selectedItem} 
          onSubmit={handleAppointmentSubmit} 
          onCancel={() => setShowAppointmentModal(false)} 
        />
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog 
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={deleteAction}
        title="Confirm Delete"
        message={`Are you sure you want to delete this ${
          selectedItem?.doctor_id ? 'doctor' : 
          selectedItem?.patient_id ? 'patient' : 
          'appointment'
        }?`}
      />
    </div>
  );
} 