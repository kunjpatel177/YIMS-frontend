import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const OrderDetailModal = ({ show, orderId, onClose, onActionSuccess }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data.data);
    } catch (err) {
      console.error('Error fetching order', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && orderId) {
      fetchOrder();
    } else {
      setOrder(null);
    }
  }, [show, orderId]);

  if (!show) return null;

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/orders/${order._id}/complete`);
      toast.success(res.data.message || 'Order completed and inventory updated successfully');
      onActionSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/orders/${order._id}/cancel`);
      toast.success(res.data.message || 'Order cancelled successfully');
      onActionSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

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
                <h5 className="modal-title fw-bold text-dark mb-0">{order?.orderNumber}</h5>
                {order && <StatusBadge status={order.status} />}
              </div>
              <div className="text-secondary small">
                {order?.orderType === 'PURCHASE' ? 'Purchase Order (Raw Materials)' : 'Sale Order (Products & Raw Materials)'}
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
            {loading && <LoadingSpinner message="Loading order details..." />}

            {!loading && order && (
              <div className="d-flex flex-column gap-3">
                {/* Header Information Grid */}
                <div className="row g-3 p-3 bg-light rounded-3 border">
                  <div className="col-sm-3">
                    <div className="text-secondary small">Order Date</div>
                    <div className="fw-semibold text-dark">{new Date(order.orderDate).toLocaleDateString()}</div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-secondary small">Expected Date</div>
                    <div className="fw-semibold text-dark">
                      {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-secondary small">Warehouse</div>
                    <div className="fw-semibold text-dark">{order.warehouse?.name} ({order.warehouse?.code})</div>
                  </div>
                  <div className="col-sm-3">
                    <div className="text-secondary small">
                      {order.orderType === 'PURCHASE' ? 'Supplier' : 'Customer'}
                    </div>
                    <div className="fw-semibold text-dark">{order.partyName || 'N/A'}</div>
                  </div>
                  {order.notes && (
                    <div className="col-12 mt-2 pt-2 border-top">
                      <div className="text-secondary small">Notes / Remarks:</div>
                      <div className="small text-dark">{order.notes}</div>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div>
                  <h6 className="fw-bold text-dark mb-2">Order Line Items</h6>
                  <div className="table-responsive-custom">
                    <table className="table table-custom mb-0">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>SKU</th>
                          <th>Item Type</th>
                          <th className="text-center">Quantity</th>
                          <th className="text-end">Unit Price</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map((it, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold text-dark">{it.item?.name || 'Item'}</td>
                            <td><span className="badge bg-light text-dark border">{it.item?.sku || 'N/A'}</span></td>
                            <td>
                              <span
                                className={`badge ${
                                  it.itemType === 'Product'
                                    ? 'bg-primary-subtle text-primary border border-primary-subtle'
                                    : 'bg-warning-subtle text-dark border border-warning-subtle'
                                }`}
                              >
                                {it.itemType === 'Product' ? 'Product' : 'Raw Material'}
                              </span>
                            </td>
                            <td className="text-center fw-bold">{it.quantity} {it.item?.unit || 'Pcs'}</td>
                            <td className="text-end">₹ {Number(it.unitPrice || 0).toFixed(2)}</td>
                            <td className="text-end fw-bold text-dark">₹ {Number(it.totalPrice || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="5" className="text-end fw-bold">Total Order Value:</td>
                          <td className="text-end fw-bold fs-6 text-primary">₹ {Number(order.totalAmount || 0).toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer d-flex justify-content-between flex-shrink-0">
            <div>
              {order?.status === 'Pending' && (
                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-success d-flex align-items-center gap-1"
                    onClick={handleComplete}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-check"></i>
                    <span>Mark as Completed (Update Stock)</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
