import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ProductModal = ({ show, product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'LED Fixture',
    unit: 'Pcs',
    description: '',
    reorderPoint: 50,
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || 'LED Fixture',
        unit: product.unit || 'Pcs',
        description: product.description || '',
        reorderPoint: product.reorderPoint !== undefined ? product.reorderPoint : 50,
        status: product.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'LED Fixture',
        unit: 'Pcs',
        description: '',
        reorderPoint: 50,
        status: 'Active'
      });
    }
  }, [product, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error('Product Name and SKU are required');
      return;
    }

    try {
      setLoading(true);
      if (product) {
        await api.put(`/products/${product._id}`, formData);
        toast.success(`Product "${formData.name}" updated successfully`);
      } else {
        await api.post('/products', formData);
        toast.success(`Product "${formData.name}" created successfully`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving product';
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
        <form onSubmit={handleSubmit} className="modal-content shadow">
          <div className="modal-header flex-shrink-0">
            <h5 className="modal-title fw-semibold">
              {product ? `Edit Product: ${product.name}` : 'Add New Product'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body" style={{ overflowY: 'auto' }}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Product Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 50WFLD"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold text-secondary">SKU / Code *</label>
                <input
                  type="text"
                  className="form-control text-uppercase"
                  placeholder="e.g. PROD-50WFLD"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold text-secondary">Category</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Floodlight"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-4">
                <label className="form-label small fw-semibold text-secondary">Unit</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold text-secondary">Reorder Point</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold text-secondary">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label small fw-semibold text-secondary">Description</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Optional product description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer flex-shrink-0">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
              <span>{product ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
