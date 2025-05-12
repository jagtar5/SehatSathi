import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../services/AuthService';

const PrivateRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isLoggedIn();
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    // Add debug logging
    console.log('PrivateRoute check:', {
      path: location.pathname,
      isAuthenticated,
      user,
      requiredRole,
      hasRequiredRole: user?.userType === requiredRole
    });
  }, [location.pathname, isAuthenticated, user, requiredRole]);

  if (!isAuthenticated) {
    // Redirect to the relevant login page based on the required role
    const loginPath = `/login/${requiredRole.toLowerCase()}`;
    console.log(`Not authenticated. Redirecting to ${loginPath}`);
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRole && (!user || user.userType !== requiredRole)) {
    // User is logged in but doesn't have the required role
    console.log(`User doesn't have required role ${requiredRole}. Redirecting to home.`);
    return <Navigate to="/" replace />;
  }

  console.log(`User authenticated and has required role. Rendering protected content.`);
  return children;
};

export default PrivateRoute;
