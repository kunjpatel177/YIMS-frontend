import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const OrderCreateModal = ({ show, initialType = 'SALE', onClose, onSuccess }) => {
  const [orderType, setOrderType] = useState(initialType);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouse, setWarehouse] = useState('');
  const [partyName, setPartyName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [autoComplete, setAutoComplete] = useState(false);

  // Available items to select
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  // Multi-item rows
  const [items, setItems] = useState([
    { itemType: initialType === 'PURCHASE' ? 'RawMaterial' : 'Product', item: '', quantity: 1, unitPrice: 0, notes: '' }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setOrderType(initialType);
      setItems([
        { itemType: initialType === 'PURCHASE' ? 'RawMaterial' : 'Product', item: '', quantity: 1, unitPrice: 0, notes: '' }
      ]);
      setPartyName('');
      setNotes('');
      setAutoComplete(false);

      const fetchOptions = async () => {
        try {
          const [whRes, prodRes, rmRes] = await Promise.all([
            api.get('/warehouses'),
            api.get('/products?limit=300'),
            api.get('/raw-materials?limit=300')
          ]);
          setWarehouses(whRes.data.data);
          if (whRes.data.data.length > 0) {
            setWarehouse(whRes.data.data[0]._id);
          }
          setProducts(prodRes.data.data);
          setRawMaterials(rmRes.data.data);
        } catch (err) {
          console.error('Error fetching order options', err);
        }
      };
      fetchOptions();
    }
  }, [show, initialType]);

  if (!show) return null;

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { itemType: orderType === 'PURCHASE' ? 'RawMaterial' : 'Product', item: '', quantity: 1, unitPrice: 0, notes: '' }
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemTypeChange = (idx, newType) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      itemType: newType,
      item: '',
      unitPrice: 0
    };
    setItems(updated);
  };

  const handleItemSelect = (idx, selectedItemId) => {
    const updated = [...items];
    const row = updated[idx];
    row.item = selectedItemId;

    if (row.itemType === 'Product') {
      const prod = products.find((p) => p._id === selectedItemId);
      if (prod && prod.price !== undefined && prod.price !== null) {
        row.unitPrice = prod.price;
      }
    } else {
      const rm = rawMaterials.find((r) => r._id === selectedItemId);
      if (rm && rm.unitCost !== undefined && rm.unitCost !== null) {
        row.unitPrice = rm.unitCost;
      }
    }
    setItems(updated);
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!warehouse) {
      toast.error('Please select a warehouse');
      return;
    }

    // Validate rows
    for (let i = 0; i < items.length; i++) {
      if (!items[i].item || Number(items[i].quantity) <= 0) {
        toast.error(`Please select a valid item and quantity for item line #${i + 1}`);
        return;
      }
    }

    try {
      setLoading(true);
      const payloadItems = items.map((it) => ({
        itemType: it.itemType,
        item: it.item,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        notes: it.notes || ''
      }));

      await api.post('/orders', {
        orderType,
        warehouse,
        orderDate,
        expectedDate: expectedDate || null,
        partyName,
        notes,
        items: payloadItems,
        autoComplete
      });

      toast.success(
        `${orderType === 'PURCHASE' ? 'Purchase' : 'Sale'} order created ${autoComplete ? 'and completed' : 'in Pending status'}`
      );
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating order';
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
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <form onSubmit={handleSubmit} className="modal-content shadow">
          <div className="modal-header flex-shrink-0">
            <h5 className="modal-title fw-semibold">
              Create New {orderType === 'PURCHASE' ? 'Purchase Order (Raw Materials)' : 'Sale Order (Products & Raw Materials)'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>

          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
              {/* Order Header Fields */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">Order Type *</label>
                  <select
                    className="form-select"
                    value={orderType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setOrderType(newType);
                      setItems([
                        { itemType: newType === 'PURCHASE' ? 'RawMaterial' : 'Product', item: '', quantity: 1, unitPrice: 0, notes: '' }
                      ]);
                    }}
                  >
                    <option value="SALE">Sale Order (Products & Raw Materials Out)</option>
                    <option value="PURCHASE">Purchase Order (Raw Materials In)</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">
                    {orderType === 'PURCHASE' ? 'Destination Warehouse *' : 'Source Warehouse *'}
                  </label>
                  <select
                    className="form-select"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    required
                  >
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold text-secondary">
                    {orderType === 'PURCHASE' ? 'Supplier Name' : 'Customer Name'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={orderType === 'PURCHASE' ? 'Vendor name' : 'Client / Distributor'}
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Order Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Expected Fulfillment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-top pt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Order Items & Quantities</h6>
                    <span className="text-secondary small">
                      Select Products or Raw Materials for each item line
                    </span>
                  </div>
                  <button type="button" onClick={handleAddItemRow} className="btn btn-outline-primary btn-sm">
                    <i className="fas fa-plus me-1"></i> Add Row
                  </button>
                </div>

                <div className="d-flex flex-column gap-2">
                  {items.map((row, idx) => (
                    <div key={idx} className="p-3 bg-light rounded-3 border">
                      <div className="row g-2 align-items-center">
                        {/* 1. Dropdown for select Products or Raw materials */}
                        <div className="col-12 col-sm-6 col-md-2">
                          <label className="form-label small fw-semibold text-secondary mb-1">
                            1. Type *
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={row.itemType}
                            onChange={(e) => handleItemTypeChange(idx, e.target.value)}
                            required
                          >
                            <option value="Product">Product</option>
                            <option value="RawMaterial">Raw Material</option>
                          </select>
                        </div>

                        {/* 2. Dropdown for all products if products is selected in first dropdown otherwise all raw material */}
                        <div className="col-12 col-sm-6 col-md-3">
                          <label className="form-label small fw-semibold text-secondary mb-1">
                            2. {row.itemType === 'Product' ? 'Select Product *' : 'Select Raw Material *'}
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={row.item}
                            onChange={(e) => handleItemSelect(idx, e.target.value)}
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

                        {/* 3. Quantity */}
                        <div className="col-6 col-sm-4 col-md-2">
                          <label className="form-label small fw-semibold text-secondary mb-1">
                            3. Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="form-control form-control-sm"
                            value={row.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            required
                          />
                        </div>

                        {/* 4. Unit Price */}
                        <div className="col-6 col-sm-4 col-md-2">
                          <label className="form-label small fw-semibold text-secondary mb-1">
                            4. Unit Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm"
                            value={row.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          />
                        </div>

                        {/* 5. Subtotal */}
                        <div className="col-8 col-sm-3 col-md-2">
                          <label className="form-label small fw-semibold text-secondary mb-1">
                            5. Subtotal
                          </label>
                          <div
                            className="form-control form-control-sm bg-white fw-bold text-dark text-truncate"
                            title={`₹ ${((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)).toFixed(2)}`}
                          >
                            ₹ {((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0)).toFixed(2)}
                          </div>
                        </div>

                        {/* Row Action */}
                        <div className="col-4 col-sm-1 col-md-1 text-end pt-md-3">
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm w-100"
                              onClick={() => handleRemoveItemRow(idx)}
                              title="Remove item"
                            >
                              <i className="fas fa-trash-can"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-end align-items-center gap-3 mt-3">
                  <div className="text-secondary small">Total Order Value:</div>
                  <div className="fs-5 fw-bold text-primary">₹ {calculateTotal().toLocaleString()}</div>
                </div>
              </div>

              {/* Notes & Auto-fulfill */}
              <div className="row g-2 mt-3 pt-3 border-top">
                <div className="col-md-7">
                  <label className="form-label small fw-semibold text-secondary">Order Notes / References</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Reference PO-1234, expedited shipping"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="col-md-5 d-flex align-items-end">
                  <div className="form-check mb-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoCompleteCheck"
                      checked={autoComplete}
                      onChange={(e) => setAutoComplete(e.target.checked)}
                    />
                    <label className="form-check-label small fw-semibold text-dark" htmlFor="autoCompleteCheck">
                      Complete Order Immediately & Update Warehouse Stock
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer flex-shrink-0">
              <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                <span>Submit Order</span>
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default OrderCreateModal;
