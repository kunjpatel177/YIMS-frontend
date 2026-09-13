import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ProductDetailModal = ({ show, productId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && productId) {
      const fetchDetails = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/products/${productId}`);
          setData(res.data.data);
        } catch (err) {
          console.error('Error fetching product details', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setData(null);
    }
  }, [show, productId]);

  if (!show) return null;

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
                <div
                  className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px' }}
                >
                  <i className="fas fa-box"></i>
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">{data?.name || 'Product Details'}</h5>
                </div>
                {data?.category && (
                  <span className="badge bg-secondary-subtle text-secondary">{data.category}</span>
                )}
              </div>
              <div className="text-secondary small mt-1 ms-1">
                SKU: <span className="badge bg-light text-dark border font-monospace">{data?.sku}</span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
            {loading && <LoadingSpinner message="Fetching live product inventory..." />}

            {!loading && data && (
              <div className="d-flex flex-column gap-4">
                {/* Summary Badges Row */}
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <div className="modal-stat-card card-primary">
                      <div className="modal-stat-header">
                        <span className="modal-stat-title">Dynamic Sales Qty</span>
                        <div className="modal-stat-icon icon-primary">
                          <i className="fas fa-chart-line"></i>
                        </div>
                      </div>
                      <div className="modal-stat-value text-primary">
                        {data.salesQuantity?.toLocaleString() || 0}
                        <span className="modal-stat-unit">{data.unit || 'units'}</span>
                      </div>
                      <div className="modal-stat-footer">
                        <i className="fas fa-circle-check text-primary fa-xs"></i>
                        <span>Computed from completed SALE orders</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="modal-stat-card card-indigo">
                      <div className="modal-stat-header">
                        <span className="modal-stat-title">Total Stock</span>
                        <div className="modal-stat-icon icon-indigo">
                          <i className="fas fa-boxes-stacked"></i>
                        </div>
                      </div>
                      <div className="modal-stat-value text-dark">
                        {data.totalStock?.toLocaleString() || 0}
                        <span className="modal-stat-unit">{data.unit || 'units'}</span>
                      </div>
                      <div className="modal-stat-footer">
                        <i className="fas fa-warehouse text-indigo fa-xs"></i>
                        <span><strong>{data.totalAvailable || 0}</strong> {data.unit || 'units'} available to ship</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="modal-stat-card card-success">
                      <div className="modal-stat-header">
                        <span className="modal-stat-title">Manufacturing Capacity</span>
                        <div className="modal-stat-icon icon-success">
                          <i className="fas fa-industry"></i>
                        </div>
                      </div>
                      <div className="modal-stat-value text-success">
                        {data.capacityInfo?.capacity?.toLocaleString() || 0}
                        <span className="modal-stat-unit">units</span>
                      </div>
                      <div className="modal-stat-footer">
                        {data.capacityInfo?.bottleneckMaterial ? (
                          <span
                            className="text-warning fw-medium text-truncate"
                            title={`Bottleneck: ${data.capacityInfo.bottleneckMaterial.name}`}
                          >
                            <i className="fas fa-triangle-exclamation fa-xs me-1"></i>
                            Bottleneck: {data.capacityInfo.bottleneckMaterial.name}
                          </span>
                        ) : (
                          <span className="text-success">
                            <i className="fas fa-shield-check fa-xs me-1"></i>
                            BOM fully supplied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warehouse Breakdown */}
                <div>
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="fas fa-warehouse text-primary me-2"></i> Warehouse Stock Breakdown
                  </h6>
                  <div className="table-responsive-custom">
                    <table className="table table-custom mb-0">
                      <thead>
                        <tr>
                          <th>Warehouse</th>
                          <th>Code</th>
                          <th>Current Stock</th>
                          <th>Reserved</th>
                          <th>Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.warehouseStocks?.map((w) => (
                          <tr key={w.warehouseId}>
                            <td className="fw-semibold">{w.warehouseName}</td>
                            <td><span className="badge bg-light text-dark border">{w.warehouseCode}</span></td>
                            <td className="fw-bold">{w.currentStock}</td>
                            <td className="text-secondary">{w.reservedStock}</td>
                            <td className="text-success fw-semibold">{w.availableStock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BOM Components Breakdown */}
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="fas fa-diagram-project text-info me-2"></i> Bill of Materials (BOM)
                    </h6>
                    <span className="badge bg-secondary">{data.bomEntries?.length || 0} Components</span>
                  </div>

                  {data.bomEntries && data.bomEntries.length > 0 ? (
                    <div className="table-responsive-custom">
                      <table className="table table-custom mb-0">
                        <thead>
                          <tr>
                            <th>Raw Material</th>
                            <th>SKU</th>
                            <th>Qty / Unit</th>
                            <th>Uses Aluminium</th>
                            <th>Aluminium Req</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.bomEntries.map((b) => (
                            <tr key={b._id}>
                              <td className="fw-semibold">{b.rawMaterial?.name}</td>
                              <td><span className="badge bg-light text-dark border">{b.rawMaterial?.sku}</span></td>
                              <td>{b.quantity} {b.unitOfMeasure}</td>
                              <td>
                                {b.rawMaterial?.usesAluminium ? (
                                  <span className="badge bg-primary-subtle text-primary">Yes</span>
                                ) : (
                                  <span className="badge bg-light text-muted border">No</span>
                                )}
                              </td>
                              <td>
                                {b.rawMaterial?.usesAluminium
                                  ? `${b.rawMaterial.aluminiumRequiredPerUnit} ${b.rawMaterial.aluminiumUnit}`
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-light border small text-secondary mb-0">
                      No Bill of Materials configured for this product.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer flex-shrink-0">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
