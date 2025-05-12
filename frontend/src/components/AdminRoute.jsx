import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthService from '../services/AuthService';

/**
 * AdminRoute - A protected route component that only allows admin users
 * All other users will be redirected to login
 */
const AdminRoute = () => {
  const user = AuthService.getCurrentUser();
  
  // Check if user is logged in and is an admin
  if (!user || user.userType !== 'Admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  // If admin, render the child routes
  return <Outlet />;
};

export default AdminRoute; 