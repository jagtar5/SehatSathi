import React from 'react';
import LoginForm from '../components/LoginForm';

const PatientLogin = () => {
  return <LoginForm userType="Patient" redirectPath="/patient" />;
};

export default PatientLogin; 