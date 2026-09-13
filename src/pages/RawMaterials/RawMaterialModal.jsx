import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const RawMaterialModal = ({ show, material, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Component',
    unit: 'Pcs',
    startingInventory: 0,
    reorderPoint: 200,
    supplier: '',
    usesAluminium: false,
    aluminiumRequiredPerUnit: 0,
    aluminiumUnit: 'gm',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        sku: material.sku || '',
        category: material.category || 'Component',
        unit: material.unit || 'Pcs',
        startingInventory: material.startingInventory || 0,
        reorderPoint: material.reorderPoint !== undefined ? material.reorderPoint : 200,
        supplier: material.supplier || '',
        usesAluminium: !!material.usesAluminium,
        aluminiumRequiredPerUnit: material.aluminiumRequiredPerUnit || 0,
        aluminiumUnit: material.aluminiumUnit || 'gm',
        status: material.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'Component',
        unit: 'Pcs',
        startingInventory: 0,
        reorderPoint: 200,
        supplier: '',
        usesAluminium: false,
        aluminiumRequiredPerUnit: 0,
        aluminiumUnit: 'gm',
        status: 'Active'
      });
    }
  }, [material, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error('Name and SKU are required');
      return;
    }

    try {
      setLoading(true);
      if (material) {
        await api.put(`/raw-materials/${material._id}`, formData);
        toast.success(`Raw material "${formData.name}" updated successfully`);
      } else {
        await api.post('/raw-materials', formData);
        toast.success(`Raw material "${formData.name}" created and initialized in Warehouse 1`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving raw material';
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
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <form onSubmit={handleSubmit} className="modal-content shadow">
          <div className="modal-header flex-shrink-0">
            <h5 className="modal-title fw-semibold">
              {material ? `Edit Raw Material: ${material.name}` : 'Add New Raw Material'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
              <div className="row g-3">
                <div className="col-md-7">
                  <label className="form-label small fw-semibold text-secondary">Raw Material Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 50W FLD FRAME"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label small fw-semibold text-secondary">SKU / Code *</label>
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    placeholder="e.g. RM-50W-FRAME"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Floodlight, Packaging"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Unit of Measure</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pcs, Set, Mtr"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Reorder Threshold</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                  />
                </div>

                {!material && (
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Starting Inventory (Warehouse 1)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.startingInventory}
                      onChange={(e) => setFormData({ ...formData, startingInventory: e.target.value })}
                    />
                    <div className="small text-muted mt-1">Starting units will be deposited into Warehouse 1</div>
                  </div>
                )}

                <div className={material ? 'col-md-12' : 'col-md-6'}>
                  <label className="form-label small fw-semibold text-secondary">Preferred Supplier</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Precision Die Casters"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>

                {/* Aluminium Configuration Section */}
                <div className="col-12 mt-4 pt-3 border-top">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="usesAluSwitch"
                      checked={formData.usesAluminium}
                      onChange={(e) => setFormData({ ...formData, usesAluminium: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold text-dark" htmlFor="usesAluSwitch">
                      Manufactured from Aluminium (Requires Aluminium Stock)
                    </label>
                  </div>

                  {formData.usesAluminium && (
                    <div className="p-3 bg-warning-subtle rounded-3 border border-warning-subtle">
                      <div className="row g-2 align-items-center">
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-dark">
                            Aluminium Required Per Unit *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control"
                            placeholder="e.g. 50"
                            value={formData.aluminiumRequiredPerUnit}
                            onChange={(e) =>
                              setFormData({ ...formData, aluminiumRequiredPerUnit: e.target.value })
                            }
                            required={formData.usesAluminium}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-dark">Aluminium Unit</label>
                          <select
                            className="form-select"
                            value={formData.aluminiumUnit}
                            onChange={(e) => setFormData({ ...formData, aluminiumUnit: e.target.value })}
                          >
                            <option value="gm">Grams (gm)</option>
                            <option value="kg">Kilograms (kg)</option>
                          </select>
                        </div>
                      </div>
                      <div className="small text-muted mt-2">
                        <i className="fas fa-info-circle me-1"></i> When manufacturing this raw material in the Aluminium
                        Production module, the system will calculate: Quantity &times; Requirement and atomically deduct
                        aluminium.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer flex-shrink-0">
              <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                <span>{material ? 'Save Changes' : 'Create Material'}</span>
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default RawMaterialModal;
