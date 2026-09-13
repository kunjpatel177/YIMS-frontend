import React from 'react';
import StatusBadge from '../../components/common/StatusBadge';

const TransferDetailModal = ({ show, transfer, onClose, onComplete, onCancel, actionLoading }) => {
  if (!show || !transfer) return null;

  const itemsList =
    transfer.items && transfer.items.length > 0
      ? transfer.items
      : [
          {
            itemType: transfer.itemType,
            item: transfer.item,
            quantity: transfer.quantity
          }
        ];

  const totalUnits = itemsList.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow">
          <div className="modal-header flex-shrink-0">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="modal-title fw-bold text-dark mb-0">{transfer.transferNumber}</h5>
                <StatusBadge status={transfer.status} />
              </div>
              <div className="text-secondary small">
                Warehouse Stock Movement Record &bull; {itemsList.length} Item Line(s)
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
            {/* Warehouse Locations Card */}
            <div className="row g-3 p-3 bg-light rounded-3 border mb-3">
              <div className="col-sm-4">
                <div className="text-secondary small">From Warehouse (Source)</div>
                <div className="fw-semibold text-danger">
                  <i className="fas fa-arrow-up-from-bracket me-1"></i>
                  {transfer.sourceWarehouse?.name} ({transfer.sourceWarehouse?.code})
                </div>
              </div>

              <div className="col-sm-4">
                <div className="text-secondary small">To Warehouse (Destination)</div>
                <div className="fw-semibold text-success">
                  <i className="fas fa-arrow-down-to-bracket me-1"></i>
                  {transfer.destinationWarehouse?.name} ({transfer.destinationWarehouse?.code})
                </div>
              </div>

              <div className="col-sm-4">
                <div className="text-secondary small">Transfer Date</div>
                <div className="fw-semibold text-dark">
                  {new Date(transfer.transferDate).toLocaleDateString()}
                </div>
              </div>

              {transfer.notes && (
                <div className="col-12 mt-2 pt-2 border-top">
                  <div className="text-secondary small">Notes / Reason:</div>
                  <div className="small text-dark">{transfer.notes}</div>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold text-dark mb-0">Transferred Items</h6>
                <span className="badge bg-secondary-subtle text-secondary">
                  {itemsList.length} Item(s) &bull; {totalUnits.toLocaleString()} Total Units
                </span>
              </div>

              <div className="table-responsive-custom">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Item Name</th>
                      <th>SKU</th>
                      <th>Item Type</th>
                      <th className="text-end">Transferred Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsList.map((it, idx) => (
                      <tr key={idx}>
                        <td className="text-secondary small">{idx + 1}</td>
                        <td className="fw-semibold text-dark">{it.item?.name || 'Item'}</td>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace">
                            {it.item?.sku || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              it.itemType === 'Product'
                                ? 'bg-primary-subtle text-primary border border-primary-subtle'
                                : 'bg-info-subtle text-info-emphasis border border-info-subtle'
                            }`}
                          >
                            {it.itemType === 'Product' ? 'Finished Product' : 'Raw Material'}
                          </span>
                        </td>
                        <td className="text-end fw-bold text-dark fs-6">
                          {Number(it.quantity).toLocaleString()} {it.item?.unit || 'Pcs'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="text-end fw-bold">Total Transferred Units:</td>
                      <td className="text-end fw-bold fs-6 text-primary">
                        {totalUnits.toLocaleString()} Units
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="modal-footer flex-shrink-0">
            {transfer.status === 'Pending' && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => onCancel(transfer)}
                  disabled={actionLoading}
                >
                  <i className="fas fa-ban me-1"></i> Cancel Transfer
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => onComplete(transfer._id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  ) : (
                    <i className="fas fa-check me-1"></i>
                  )}
                  Execute & Shift Stock
                </button>
              </>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferDetailModal;
