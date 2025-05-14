import React from 'react';
import LoginForm from '../components/LoginForm';

const ReceptionistLogin = () => {
  return <LoginForm userType="Receptionist" redirectPath="/receptionist" />;
};

export default ReceptionistLogin; 