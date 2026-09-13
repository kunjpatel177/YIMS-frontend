import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RawMaterialDetailModal = ({ show, materialId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && materialId) {
      const fetchDetails = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/raw-materials/${materialId}`);
          setData(res.data.data);
        } catch (err) {
          console.error('Error fetching raw material details', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setData(null);
    }
  }, [show, materialId]);

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
                  className="rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px' }}
                >
                  <i className="fas fa-cubes"></i>
                </div>
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">{data?.name || 'Raw Material Details'}</h5>
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
            {loading && <LoadingSpinner message="Calculating material stock balances..." />}

            {!loading && data && (
              <div className="d-flex flex-column gap-4">
                {/* Dynamic Inventory Formula Tiles */}
                <div className="row g-3">
                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="modal-stat-card card-slate">
                      <div className="modal-stat-header">
                        <span className="modal-stat-title">Starting Stock</span>
                        <div className="modal-stat-icon icon-slate">
                          <i className="fas fa-clock-rotate-left"></i>
                        </div>
                      </div>
                      <div className="modal-stat-value text-dark">
                        {data.startingInventory?.toLocaleString() || 0}
                        <span className="modal-stat-unit">{data.unit}</span>
                      </div>
                      <div className="modal-stat-footer">
                        <i className="fas fa-database text-secondary fa-xs"></i>
                        <span>Legacy baseline</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="modal-stat-card card-info">
                      <div className="modal-stat-header">
                        <span className="modal-stat-title">Purchased</span>
                        <div className="modal-stat-icon icon-info">
                          <i className="fas fa-truck-ramp-box"></i>
                        </div>
                      </div>
                      <div className="modal-stat-value text-info">
                        +{data.purchasedQuantity?.toLocaleString() || 0}
                        <span className="modal-stat-unit">{data.unit}</span>
                      </div>
                      <div className="modal-stat-footer">
                        <i className="fas fa-receipt text-info fa-xs"></i>
                        <span>Via purchase orders</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="modal-stat-card card-success">
                      <div className="modal-stat-header">
                        <span className="modal-stat-title">Produced</span>
                        <div className="modal-stat-icon icon-success">
                          <i className="fas fa-fire-burner"></i>
                        </div>
                      </div>
                      <div className="modal-stat-value text-success">
                        +{data.productionOutput?.toLocaleString() || 0}
                        <span className="modal-stat-unit">{data.unit}</span>
                      </div>
                      <div className="modal-stat-footer">
                        <i className="fas fa-layer-group text-success fa-xs"></i>
                        <span>Alu plant output</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-lg-3">
                    <div className="modal-stat-card card-primary">
                      <div className="modal-stat-header">
                        <span className="modal-stat-title">Current Stock</span>
                        <div className="modal-stat-icon icon-primary">
                          <i className="fas fa-warehouse"></i>
                        </div>
                      </div>
                      <div className="modal-stat-value text-primary">
                        {data.currentInventory?.toLocaleString() || 0}
                        <span className="modal-stat-unit">{data.unit}</span>
                      </div>
                      <div className="modal-stat-footer justify-content-between">
                        <span className="text-muted small">Status</span>
                        <StatusBadge status={data.reorderStatus} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aluminium Specs if applicable */}
                {data.usesAluminium && (
                  <div className="p-3 bg-warning-subtle rounded-3 border border-warning-subtle d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold text-dark">
                        <i className="fas fa-layer-group text-warning me-2"></i> Manufactured from Aluminium
                      </div>
                      <div className="text-secondary small">
                        Each 1 {data.unit} requires <strong>{data.aluminiumRequiredPerUnit} {data.aluminiumUnit}</strong> of raw aluminium.
                      </div>
                    </div>
                    <span className="badge bg-warning text-dark px-3 py-2">
                      {data.aluminiumRequiredPerUnit} {data.aluminiumUnit} / unit
                    </span>
                  </div>
                )}

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

                {/* Products Using this in BOM */}
                <div>
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="fas fa-diagram-project text-info me-2"></i> Used in Finished Products (BOM)
                  </h6>
                  {data.usedInBOM && data.usedInBOM.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {data.usedInBOM.map((b) => (
                        <span key={b._id} className="badge bg-light text-dark border p-2">
                          <i className="fas fa-cube text-secondary me-1"></i> {b.product?.name} ({b.product?.sku})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-light border small text-secondary mb-0">
                      Not currently assigned to any product Bill of Materials.
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

export default RawMaterialDetailModal;
