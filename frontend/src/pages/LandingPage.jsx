import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-overlay"></div>
      <div className="landing-content">
        <h1>Welcome to Hospital Management System</h1>
        <p>Please select your role to continue</p>
        
        <div className="role-cards">
          <div className="role-card">
            <div className="role-icon doctor-icon">
              <i className="fas fa-user-md"></i>
            </div>
            <h2>Doctor</h2>
            <p>Access patient records, schedules, and more</p>
            <Link to="/login/doctor" className="role-button">Sign In as Doctor</Link>
          </div>
          
          <div className="role-card">
            <div className="role-icon patient-icon">
              <i className="fas fa-procedures"></i>
            </div>
            <h2>Patient</h2>
            <p>Book appointments and view medical history</p>
            <Link to="/login/patient" className="role-button">Sign In as Patient</Link>
          </div>
          
          <div className="role-card">
            <div className="role-icon receptionist-icon">
              <i className="fas fa-user-nurse"></i>
            </div>
            <h2>Receptionist</h2>
            <p>Manage appointments and patient registrations</p>
            <Link to="/login/receptionist" className="role-button">Sign In as Receptionist</Link>
          </div>
          
          <div className="role-card">
            <div className="role-icon admin-icon">
              <i className="fas fa-user-shield"></i>
            </div>
            <h2>Admin</h2>
            <p>Oversee hospital operations and data</p>
            <Link to="/login/admin" className="role-button">Sign In as Admin</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 