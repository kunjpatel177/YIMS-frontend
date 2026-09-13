import React from 'react';

const EmptyState = ({
  icon = 'fa-folder-open',
  title = 'No records found',
  description = 'Try adjusting your search query or filters to find what you are looking for.',
  actionBtn = null
}) => {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex align-items-center justify-content-center bg-light text-secondary rounded-circle mb-3"
        style={{ width: '64px', height: '64px' }}
      >
        <i className={`fas ${icon} fa-2x`}></i>
      </div>
      <h5 className="fw-semibold text-dark mb-1">{title}</h5>
      <p className="text-secondary small mb-3 mx-auto" style={{ maxWidth: '400px' }}>
        {description}
      </p>
      {actionBtn}
    </div>
  );
};

export default EmptyState;
