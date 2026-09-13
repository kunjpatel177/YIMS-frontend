import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
      <div className="display-1 fw-bold text-primary mb-2">404</div>
      <h3 className="fw-bold text-dark mb-2">Page Not Found</h3>
      <p className="text-secondary small mb-4" style={{ maxWidth: '400px' }}>
        The requested manufacturing resource or page does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary d-flex align-items-center gap-2">
        <i className="fas fa-home"></i>
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
