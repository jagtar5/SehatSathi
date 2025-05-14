import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'}>
      <div className="confirm-dialog">
        <p className="confirm-message">{message || 'Are you sure you want to proceed with this action?'}</p>
        
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            {cancelText}
          </button>
          <button className="danger-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog; 