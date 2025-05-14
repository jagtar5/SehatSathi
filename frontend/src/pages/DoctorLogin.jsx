import React from 'react';
import LoginForm from '../components/LoginForm';

const DoctorLogin = () => {
  return <LoginForm userType="Doctor" redirectPath="/doctor" />;
};

export default DoctorLogin; 