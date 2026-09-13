import React from 'react';

const LoadingSpinner = ({ message = 'Loading data...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
      <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="small fw-medium">{message}</div>
    </div>
  );
};

export default LoadingSpinner;
