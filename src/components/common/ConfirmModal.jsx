import React from 'react';

const ConfirmModal = ({
  show,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmBtnClass = 'btn-danger',
  onConfirm,
  onCancel,
  loading = false
}) => {
  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow">
          <div className="modal-header flex-shrink-0">
            <h5 className="modal-title fw-semibold">{title}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onCancel}
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-secondary mb-0">{message}</p>
          </div>
          <div className="modal-footer flex-shrink-0">
            <button
              type="button"
              className="btn btn-light"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${confirmBtnClass} d-flex align-items-center gap-2`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
