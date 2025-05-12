import React, { useEffect } from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, title, children, onClose, size = 'medium' }) => {
  // Protect against null/undefined onClose
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  
  // Hooks must be called at the top level, before any conditional returns
  useEffect(() => {
    // Only add listeners and modify body style if modal is open
    if (isOpen) {
      const handleEscKey = (event) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleEscKey);
      // Prevent scrolling of the background
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]); // Removed onClose from dependencies to prevent issues
  
  // Early return after hooks are called
  if (!isOpen) return null;

  // Determine modal size class
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'modal-sm';
      case 'large':
        return 'modal-lg';
      case 'medium':
      default:
        return '';
    }
  };

  // Close modal when clicking on backdrop with safeguard against missing onClose
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-content ${getSizeClass()}`}>
        <div className="modal-header">
          <h3>{title || 'Modal'}</h3>
          <button className="modal-close-btn" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 