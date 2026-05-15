import React from 'react';
import '../styles/LoadingModal.css';

const LoadingModal = ({ isVisible, message = 'Enregistrement en cours' }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="loading-modal-overlay">
      <div className="loading-modal">
        <div className="loading-spinner"></div>
        <p className="loading-text">{message}</p>
      </div>
    </div>
  );
};

export default LoadingModal;
