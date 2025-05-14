import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import apiClient from '../api/client';

const PatientRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiClient.get('/current-user/');
        const isPatient = res.data && res.data.userType === 'Patient';
        setIsAuthenticated(isPatient);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Verifying access...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  return isAuthenticated ? <Outlet /> : <Navigate to="/login/patient" />;
};

export default PatientRoute; 