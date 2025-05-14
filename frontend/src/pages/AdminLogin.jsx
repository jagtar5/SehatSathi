import React from 'react';
import LoginForm from '../components/LoginForm';
import { Navigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

const AdminLogin = () => {
  // Check if user is already logged in as admin
  const currentUser = AuthService.getCurrentUser();
  if (currentUser && currentUser.userType === 'Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <LoginForm userType="Admin" redirectPath="/admin/dashboard" />;
};

export default AdminLogin; 