import React from 'react';
import '../styles/ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className="confirm-header">
          <h3>{title || 'Confirm Action'}</h3>
        </div>
        <div className="confirm-body">
          <p>{message || 'Are you sure you want to proceed?'}</p>
        </div>
        <div className="confirm-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 