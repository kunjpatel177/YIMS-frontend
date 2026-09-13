import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const DuplicateBOMModal = ({ show, sourceProductId, onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [sourceId, setSourceId] = useState(sourceProductId || '');
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setSourceId(sourceProductId || '');
      const fetchProducts = async () => {
        try {
          const res = await api.get('/products?limit=300');
          setProducts(res.data.data);
        } catch (err) {
          console.error('Error fetching products', err);
        }
      };
      fetchProducts();
    }
  }, [show, sourceProductId]);

  if (!show) return null;

  const handleDuplicate = async (e) => {
    e.preventDefault();
    if (!sourceId || !targetId) {
      toast.error('Please select both source and target products');
      return;
    }

    if (sourceId === targetId) {
      toast.error('Source and target products cannot be the same');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/bom/duplicate', {
        sourceProductId: sourceId,
        targetProductId: targetId
      });
      toast.success(res.data.message || 'BOM duplicated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to duplicate BOM';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form onSubmit={handleDuplicate} className="modal-content shadow">
          <div className="modal-header flex-shrink-0">
            <h5 className="modal-title fw-semibold">Duplicate Bill of Materials (BOM)</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
            <p className="text-secondary small mb-3">
              Quickly clone all component raw material mappings from one product template to another.
            </p>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Source Product (Copy from)</label>
              <select
                className="form-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                required
              >
                <option value="">-- Select Source Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Target Product (Copy to)</label>
              <select
                className="form-select"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
              >
                <option value="">-- Select Target Product --</option>
                {products
                  .filter((p) => p._id !== sourceId)
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="modal-footer flex-shrink-0">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary d-flex align-items-center gap-1" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
              <i className="fas fa-copy"></i>
              <span>Duplicate BOM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DuplicateBOMModal;
