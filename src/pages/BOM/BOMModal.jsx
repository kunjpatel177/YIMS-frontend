import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const BOMModal = ({ show, bomItem, defaultProductId, onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [formData, setFormData] = useState({
    product: defaultProductId || '',
    rawMaterial: '',
    quantity: 1,
    unitOfMeasure: 'Pcs',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSelects = async () => {
      try {
        const [prodRes, rmRes] = await Promise.all([
          api.get('/products?limit=300'),
          api.get('/raw-materials?limit=300')
        ]);
        setProducts(prodRes.data.data);
        setMaterials(rmRes.data.data);
      } catch (err) {
        console.error('Error loading product/rm options', err);
      }
    };
    if (show) loadSelects();
  }, [show]);

  useEffect(() => {
    if (bomItem) {
      setFormData({
        product: bomItem.product?._id || bomItem.product || defaultProductId || '',
        rawMaterial: bomItem.rawMaterial?._id || bomItem.rawMaterial || '',
        quantity: bomItem.quantity || 1,
        unitOfMeasure: bomItem.unitOfMeasure || 'Pcs',
        notes: bomItem.notes || ''
      });
    } else {
      setFormData({
        product: defaultProductId || '',
        rawMaterial: '',
        quantity: 1,
        unitOfMeasure: 'Pcs',
        notes: ''
      });
    }
  }, [bomItem, defaultProductId, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product || !formData.rawMaterial || Number(formData.quantity) <= 0) {
      toast.error('Please specify valid product, raw material, and quantity');
      return;
    }

    try {
      setLoading(true);
      if (bomItem) {
        await api.put(`/bom/${bomItem._id}`, formData);
        toast.success('BOM item updated successfully');
      } else {
        await api.post('/bom', formData);
        toast.success('Component added to BOM successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving BOM entry';
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
              {bomItem ? 'Edit BOM Component' : 'Add Component to Bill of Materials'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Finished Product *</label>
              <select
                className="form-select"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                disabled={!!bomItem || !!defaultProductId}
                required
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Raw Material Component *</label>
              <select
                className="form-select"
                value={formData.rawMaterial}
                onChange={(e) => {
                  const sel = materials.find((m) => m._id === e.target.value);
                  setFormData({
                    ...formData,
                    rawMaterial: e.target.value,
                    unitOfMeasure: sel?.unit || 'Pcs'
                  });
                }}
                disabled={!!bomItem}
                required
              >
                <option value="">-- Select Raw Material --</option>
                {materials.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.sku}) {m.usesAluminium ? '• Uses Aluminium' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-semibold text-secondary">Required Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold text-secondary">Unit of Measure</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.unitOfMeasure}
                  onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label small fw-semibold text-secondary">Notes / Specification</label>
              <input
                type="text"
                className="form-control"
                placeholder="Optional assembly note"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer flex-shrink-0">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
              <span>{bomItem ? 'Save Changes' : 'Add to BOM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BOMModal;
