import React from 'react';
import LoginForm from '../components/LoginForm';

const AdminLogin = () => {
  return <LoginForm userType="Admin" redirectPath="/hms" />;
};

export default AdminLogin; 