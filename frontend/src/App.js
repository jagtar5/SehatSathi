import React, { useEffect, useState } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import AuthService from './services/AuthService';
import './App.css';

// Custom header component that won't show on the landing page
const ConditionalHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const isLandingPage = location.pathname === '/';
  
  useEffect(() => {
    // Check for logged in user
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
  }, [location.pathname]);
  
  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };
  
  if (isLandingPage) {
    return null;
  }
  
  return (
    <header className="App-header p-3 bg-dark text-white">
      <div className="container d-flex justify-content-between align-items-center">
        <h1>Hospital Management System</h1>
        <div>
          {user ? (
            <div className="d-flex align-items-center">
              <span className="me-3">Welcome, {user.fullName || user.username}</span>
              <button onClick={handleLogout} className="btn btn-outline-light">Logout</button>
            </div>
          ) : (
            <a href="/" className="btn btn-outline-light">Back to Home</a>
          )}
        </div>
      </div>
    </header>
  );
};

// Custom footer component
const Footer = () => (
  <footer className="bg-light p-3 text-center mt-5">
    <div className="container">
      <p>&copy; {new Date().getFullYear()} - Hospital Management System</p>
    </div>
  </footer>
);

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <ConditionalHeader />
        <main>
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
