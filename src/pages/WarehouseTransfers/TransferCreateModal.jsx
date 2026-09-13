import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const TransferCreateModal = ({ show, onClose, onSuccess }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [autoExecute, setAutoExecute] = useState(true);
  const [loading, setLoading] = useState(false);

  // Available catalog
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  // Source warehouse stock cache: { [`${itemType}_${itemId}`]: stock }
  const [sourceStockMap, setSourceStockMap] = useState({});
  const [stockLoading, setStockLoading] = useState(false);

  // Multi-item transfer lines
  const [items, setItems] = useState([
    { itemType: 'RawMaterial', item: '', quantity: 1 }
  ]);

  // Load catalogs and warehouses when modal opens
  useEffect(() => {
    if (show) {
      const loadInitialData = async () => {
        try {
          const [whRes, prodRes, rmRes] = await Promise.all([
            api.get('/warehouses'),
            api.get('/products?limit=500'),
            api.get('/raw-materials?limit=500')
          ]);
          setWarehouses(whRes.data.data);
          if (whRes.data.data.length >= 2) {
            setSourceWarehouseId(whRes.data.data[0]._id);
            setDestinationWarehouseId(whRes.data.data[1]._id);
          } else if (whRes.data.data.length === 1) {
            setSourceWarehouseId(whRes.data.data[0]._id);
          }
          setProducts(prodRes.data.data);
          setRawMaterials(rmRes.data.data);

          // Reset form items
          setItems([
            { itemType: 'RawMaterial', item: '', quantity: 1 }
          ]);
          setNotes('');
          setAutoExecute(true);
        } catch (err) {
          console.error('Error loading transfer initial data', err);
          toast.error('Failed to load warehouses and items');
        }
      };
      loadInitialData();
    }
  }, [show]);

  // Fetch source warehouse stock inventory whenever sourceWarehouseId changes
  useEffect(() => {
    const fetchSourceStock = async () => {
      if (!sourceWarehouseId) {
        setSourceStockMap({});
        return;
      }
      try {
        setStockLoading(true);
        const res = await api.get(`/warehouse-inventory?warehouseId=${sourceWarehouseId}&limit=1000`);
        const map = {};
        if (res.data?.data) {
          res.data.data.forEach((inv) => {
            if (inv.item?._id) {
              const avail = Math.max(0, (inv.currentStock || 0) - (inv.reservedStock || 0));
              map[`${inv.itemType}_${inv.item._id}`] = avail;
            }
          });
        }
        setSourceStockMap(map);
      } catch (err) {
        console.error('Error fetching source warehouse inventory', err);
        setSourceStockMap({});
      } finally {
        setStockLoading(false);
      }
    };

    if (show && sourceWarehouseId) {
      fetchSourceStock();
    }
  }, [sourceWarehouseId, show]);

  if (!show) return null;

  // Row operations
  const handleAddItemRow = (defaultType = 'RawMaterial') => {
    setItems([
      ...items,
      { itemType: defaultType, item: '', quantity: 1 }
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleRowTypeChange = (idx, newType) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      itemType: newType,
      item: '', // reset item selection when type changes
      quantity: 1
    };
    setItems(updated);
  };

  const handleRowItemChange = (idx, itemId) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      item: itemId
    };
    setItems(updated);
  };

  const handleRowQuantityChange = (idx, qtyVal) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      quantity: qtyVal === '' ? '' : Math.max(1, Number(qtyVal))
    };
    setItems(updated);
  };

  const getItemObj = (itemType, itemId) => {
    if (!itemId) return null;
    if (itemType === 'Product') {
      return products.find((p) => p._id === itemId);
    }
    return rawMaterials.find((rm) => rm._id === itemId);
  };

  const getAvailableStock = (itemType, itemId) => {
    if (!itemId) return null;
    return sourceStockMap[`${itemType}_${itemId}`] ?? 0;
  };

  const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  // Check if any row has stock deficit
  const hasDeficit = items.some((row) => {
    if (!row.item) return false;
    const avail = getAvailableStock(row.itemType, row.item);
    return avail !== null && Number(row.quantity) > avail;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sourceWarehouseId || !destinationWarehouseId) {
      toast.error('Please select both source and destination warehouses');
      return;
    }

    if (sourceWarehouseId === destinationWarehouseId) {
      toast.error('Source warehouse and destination warehouse cannot be the same');
      return;
    }

    // Validate rows
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.item) {
        toast.error(`Please select an item for item line #${i + 1}`);
        return;
      }
      if (!row.quantity || Number(row.quantity) <= 0) {
        toast.error(`Please enter a valid transfer quantity for line #${i + 1}`);
        return;
      }

      const avail = getAvailableStock(row.itemType, row.item);
      if (avail !== null && Number(row.quantity) > avail) {
        const itemObj = getItemObj(row.itemType, row.item);
        toast.error(
          `Line #${i + 1} (${itemObj?.name || 'Item'}): Requested quantity (${row.quantity}) exceeds available stock (${avail}) in source warehouse`
        );
        return;
      }
    }

    try {
      setLoading(true);
      await api.post('/warehouse-transfers', {
        sourceWarehouseId,
        destinationWarehouseId,
        transferDate,
        notes,
        autoExecute,
        items: items.map((it) => ({
          itemType: it.itemType,
          itemId: it.item,
          quantity: Number(it.quantity)
        }))
      });

      toast.success(
        `Transfer with ${items.length} item(s) ${
          autoExecute ? 'completed and inventory shifted' : 'initiated in Pending status'
        } successfully`
      );
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing transfer';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const sourceWh = warehouses.find((w) => w._id === sourceWarehouseId);
  const destWh = warehouses.find((w) => w._id === destinationWarehouseId);

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <form onSubmit={handleSubmit} className="modal-content shadow">
          <div className="modal-header flex-shrink-0">
            <div>
              <h5 className="modal-title fw-semibold text-dark mb-0">
                Initiate Warehouse Stock Transfer
              </h5>
              <div className="text-secondary small">
                Transfer multiple raw materials and/or finished products between warehouses
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
              {/* Warehouse Locations */}
              <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    From Warehouse (Source) *
                  </label>
                  <select
                    className="form-select"
                    value={sourceWarehouseId}
                    onChange={(e) => setSourceWarehouseId(e.target.value)}
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                  <div className="form-text small">
                    {stockLoading ? (
                      <span className="text-primary">
                        <i className="fas fa-spinner fa-spin me-1"></i> Checking warehouse inventory...
                      </span>
                    ) : (
                      <span className="text-muted">Stock will be deducted from this location</span>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    To Warehouse (Destination) *
                  </label>
                  <select
                    className={`form-select ${
                      sourceWarehouseId && destinationWarehouseId && sourceWarehouseId === destinationWarehouseId
                        ? 'is-invalid'
                        : ''
                    }`}
                    value={destinationWarehouseId}
                    onChange={(e) => setDestinationWarehouseId(e.target.value)}
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                  {sourceWarehouseId && destinationWarehouseId && sourceWarehouseId === destinationWarehouseId && (
                    <div className="invalid-feedback small d-block">
                      Source and destination warehouses cannot be the same!
                    </div>
                  )}
                  <div className="form-text small text-muted">Stock will be added to this location</div>
                </div>
              </div>

              {/* Multi-Item Transfer Section */}
              <div className="border-top pt-3 mb-4">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Transfer Items & Quantities</h6>
                    <span className="text-secondary small">
                      Select items and review real-time available stock in {sourceWh?.name || 'source warehouse'}
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItemRow('RawMaterial')}
                      className="btn btn-outline-info btn-sm"
                    >
                      <i className="fas fa-plus me-1"></i> Add Raw Material
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItemRow('Product')}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="fas fa-plus me-1"></i> Add Product
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="d-flex flex-column gap-2">
                  {items.map((row, idx) => {
                    const avail = getAvailableStock(row.itemType, row.item);
                    const itemObj = getItemObj(row.itemType, row.item);
                    const isExceeded = row.item && avail !== null && Number(row.quantity) > avail;

                    return (
                      <div key={idx} className="p-3 bg-light rounded-3 border">
                        <div className="row g-2 align-items-center">
                          {/* 1. Item Type */}
                          <div className="col-12 col-sm-6 col-md-2">
                            <label className="form-label small fw-semibold text-secondary mb-1">
                              Type *
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={row.itemType}
                              onChange={(e) => handleRowTypeChange(idx, e.target.value)}
                            >
                              <option value="RawMaterial">Raw Material</option>
                              <option value="Product">Finished Product</option>
                            </select>
                          </div>

                          {/* 2. Item Dropdown */}
                          <div className="col-12 col-sm-6 col-md-4">
                            <label className="form-label small fw-semibold text-secondary mb-1">
                              {row.itemType === 'Product' ? 'Select Product *' : 'Select Raw Material *'}
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={row.item}
                              onChange={(e) => handleRowItemChange(idx, e.target.value)}
                              required
                            >
                              <option value="">
                                -- Choose {row.itemType === 'Product' ? 'Product' : 'Raw Material'} --
                              </option>
                              {row.itemType === 'Product'
                                ? products.map((p) => (
                                    <option key={p._id} value={p._id}>
                                      {p.name} ({p.sku})
                                    </option>
                                  ))
                                : rawMaterials.map((rm) => (
                                    <option key={rm._id} value={rm._id}>
                                      {rm.name} ({rm.sku}) {rm.unit ? `- ${rm.unit}` : ''}
                                    </option>
                                  ))}
                            </select>
                          </div>

                          {/* 3. Available Stock in Source Warehouse */}
                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-semibold text-secondary mb-1">
                              Available in Source ({sourceWh?.code || 'Source'})
                            </label>
                            <div>
                              {row.item ? (
                                <span
                                  className={`badge w-100 py-2 d-flex align-items-center justify-content-center text-truncate ${
                                    avail > 0
                                      ? 'bg-success-subtle text-success-emphasis border border-success-subtle'
                                      : 'bg-danger-subtle text-danger border border-danger-subtle'
                                  }`}
                                  style={{ fontSize: '0.85rem' }}
                                  title={`Available stock in ${sourceWh?.name || 'source'}: ${avail} ${itemObj?.unit || 'Pcs'}`}
                                >
                                  <i
                                    className={`fas ${
                                      avail > 0 ? 'fa-check-circle' : 'fa-triangle-exclamation'
                                    } me-1`}
                                  ></i>
                                  {avail.toLocaleString()} {itemObj?.unit || 'Pcs'}
                                </span>
                              ) : (
                                <span
                                  className="badge bg-light text-muted border w-100 py-2 d-flex align-items-center justify-content-center"
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  Select an item
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 4. Transfer Quantity */}
                          <div className="col-5 col-md-2">
                            <label className="form-label small fw-semibold text-secondary mb-1">
                              Transfer Qty *
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className={`form-control form-control-sm ${isExceeded ? 'is-invalid' : ''}`}
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) => handleRowQuantityChange(idx, e.target.value)}
                              required
                            />
                          </div>

                          {/* 5. Delete Action */}
                          <div className="col-1 col-md-1 text-end pt-md-3">
                            {items.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm w-100"
                                onClick={() => handleRemoveItemRow(idx)}
                                title="Remove line"
                              >
                                <i className="fas fa-trash-can"></i>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Deficit Alert per row */}
                        {isExceeded && (
                          <div className="small text-danger mt-1">
                            <i className="fas fa-exclamation-triangle me-1"></i>
                            Requested quantity ({row.quantity}) exceeds available source stock (
                            {avail.toLocaleString()} {itemObj?.unit || 'Pcs'})!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Items Summary Footer */}
                <div className="d-flex justify-content-between align-items-center mt-3 p-2 bg-light rounded-3 border">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary text-white">
                      {items.length} Line Item{items.length > 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddItemRow('RawMaterial')}
                      className="btn btn-link btn-sm p-0 text-decoration-none text-primary"
                    >
                      <i className="fas fa-plus fa-xs me-1"></i> Add more
                    </button>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-secondary small">Total Units to Shift:</span>
                    <span className="fs-6 fw-bold text-primary">
                      {totalUnits.toLocaleString()} Units
                    </span>
                  </div>
                </div>
              </div>

              {/* Transfer Date and Notes */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Transfer Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Notes / Reason</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Replenishment for assembly line, inter-shed balancing"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="autoExecuteCheck"
                  checked={autoExecute}
                  onChange={(e) => setAutoExecute(e.target.checked)}
                />
                <label className="form-check-label small fw-semibold text-dark" htmlFor="autoExecuteCheck">
                  Execute Immediately & Shift Stock (Completed)
                </label>
              </div>
            </div>

            <div className="modal-footer flex-shrink-0">
              <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-1"
                disabled={loading || hasDeficit || (sourceWarehouseId === destinationWarehouseId)}
              >
                {loading && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                <i className="fas fa-truck-moving"></i>
                <span>Initiate Transfer ({totalUnits.toLocaleString()} units)</span>
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default TransferCreateModal;
