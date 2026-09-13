import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import OrderCreateModal from './OrderCreateModal';
import OrderDetailModal from './OrderDetailModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import ExportButtons from '../../components/common/ExportButtons';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';

const OrdersHub = () => {
  const [activeTab, setActiveTab] = useState('SALE'); // 'SALE' | 'PURCHASE' | 'ALUMINIUM'
  const [orders, setOrders] = useState([]);
  const [aluPurchases, setAluPurchases] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showAluModal, setShowAluModal] = useState(false);
  const [aluFormData, setAluFormData] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: '',
    quantityInput: '',
    unitInput: 'kg',
    pricePerUnit: '',
    notes: '',
    autoComplete: true
  });
  const [aluModalLoading, setAluModalLoading] = useState(false);

  // Action modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch standard Purchase / Sale Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        orderType: activeTab,
        status,
        warehouseId,
        startDate,
        endDate,
        search,
        page,
        limit
      };
      const res = await api.get('/orders', { params });
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error loading orders', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Aluminium Purchases
  const fetchAluPurchases = async () => {
    try {
      setLoading(true);
      const params = {
        status,
        supplier: search,
        startDate,
        endDate,
        page,
        limit
      };
      const res = await api.get('/aluminium/purchases', { params });
      setAluPurchases(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error loading aluminium purchases', err);
    } finally {
      setLoading(false);
    }
  };

  // Load warehouses for filter
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const res = await api.get('/warehouses');
        setWarehouses(res.data.data);
      } catch (err) {
        console.error('Error loading warehouses', err);
      }
    };
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (activeTab === 'ALUMINIUM') {
      fetchAluPurchases();
    } else {
      fetchOrders();
    }
  }, [activeTab, page, status, warehouseId, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    if (activeTab === 'ALUMINIUM') fetchAluPurchases();
    else fetchOrders();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setWarehouseId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/orders/${orderId}/complete`);
      toast.success(res.data.message || 'Order completed and inventory updated');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCancel = (ord) => {
    setCancelTarget(ord);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setActionLoading(true);
      await api.post(`/orders/${cancelTarget._id}/cancel`);
      toast.success(`Order ${cancelTarget.orderNumber} cancelled`);
      setShowCancelModal(false);
      setCancelTarget(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAluPurchase = async (purchaseId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/aluminium/purchases/${purchaseId}/complete`);
      toast.success(res.data.message || 'Aluminium purchase completed and ledger updated');
      fetchAluPurchases();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete purchase');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAluSubmit = async (e) => {
    e.preventDefault();
    if (!aluFormData.quantityInput || Number(aluFormData.quantityInput) <= 0) {
      toast.error('Valid quantity is required');
      return;
    }

    try {
      setAluModalLoading(true);
      await api.post('/aluminium/purchases', aluFormData);
      toast.success('Aluminium purchase recorded successfully');
      setShowAluModal(false);
      setAluFormData({
        purchaseDate: new Date().toISOString().split('T')[0],
        supplier: '',
        quantityInput: '',
        unitInput: 'kg',
        pricePerUnit: '',
        notes: '',
        autoComplete: true
      });
      fetchAluPurchases();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording aluminium purchase');
    } finally {
      setAluModalLoading(false);
    }
  };

  // Export dataset for standard orders
  const ordersExportData = orders.map((o) => ({
    'Order Number': o.orderNumber,
    'Type': o.orderType,
    'Date': new Date(o.orderDate).toLocaleDateString(),
    'Warehouse': o.warehouse?.name || 'N/A',
    'Party': o.partyName || 'N/A',
    'Items Count': o.items?.length || 0,
    'Total Amount': o.totalAmount || 0,
    'Status': o.status,
    'Notes': o.notes || ''
  }));

  // Export dataset for aluminium purchases
  const aluExportData = aluPurchases.map((a) => ({
    'Purchase Number': a.purchaseNumber,
    'Date': new Date(a.purchaseDate).toLocaleDateString(),
    'Supplier': a.supplier || 'N/A',
    'Quantity Input': a.quantityInput,
    'Unit': a.unitInput,
    'Quantity (gm)': a.quantityGm,
    'Price / Unit': a.pricePerUnit,
    'Total Cost': a.totalCost,
    'Status': a.status,
    'Notes': a.notes || ''
  }));

  // Quick stats calculations
  const totalCount = pagination?.total || (activeTab === 'ALUMINIUM' ? aluPurchases.length : orders.length);
  const completedCount = activeTab === 'ALUMINIUM'
    ? aluPurchases.filter((a) => a.status === 'Completed').length
    : orders.filter((o) => o.status === 'Completed').length;
  const pendingCount = activeTab === 'ALUMINIUM'
    ? aluPurchases.filter((a) => a.status === 'Pending').length
    : orders.filter((o) => o.status === 'Pending').length;
  const totalSummaryVal = activeTab === 'ALUMINIUM'
    ? `${(aluPurchases.reduce((acc, a) => acc + (Number(a.quantityGm) || 0), 0) / 1000).toFixed(1)} kg`
    : `₹ ${orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0).toLocaleString()}`;
  const totalSummaryLabel = activeTab === 'ALUMINIUM' ? 'Total Ingot Procured' : 'Volume Invoiced';

  const headerIcon = activeTab === 'SALE' ? 'fa-cart-shopping' : activeTab === 'PURCHASE' ? 'fa-truck-ramp-box' : 'fa-layer-group';
  const headerBg = activeTab === 'SALE' ? 'bg-primary text-white' : activeTab === 'PURCHASE' ? 'bg-info text-white' : 'bg-warning text-dark';
  const contextPill = activeTab === 'SALE' ? 'Sales Invoicing' : activeTab === 'PURCHASE' ? 'Procurement' : 'Aluminium Purchase';

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className={`page-header-icon ${headerBg} shadow-sm`}>
            <i className={`fas ${headerIcon}`}></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="page-header-title mb-0">Orders & Fulfillment Hub</h4>
              <span className="page-context-pill">{contextPill}</span>
            </div>
            <p className="page-header-subtitle mb-0">
              Fulfill sale dispatches, procure raw materials, and log aluminium deliveries
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {activeTab === 'ALUMINIUM' ? (
            <>
              <ExportButtons
                data={aluExportData}
                title="Aluminium Purchases History"
                filename="aluminium_purchases_report"
              />
              <button
                onClick={() => setShowAluModal(true)}
                className="btn btn-warning btn-sm d-flex align-items-center gap-1 shadow-sm text-dark fw-semibold px-3"
              >
                <i className="fas fa-layer-group"></i>
                <span>Buy Aluminium</span>
              </button>
            </>
          ) : (
            <>
              <ExportButtons
                data={ordersExportData}
                title={`${activeTab === 'SALE' ? 'Sale' : 'Purchase'} Orders Ledger`}
                filename={`${activeTab.toLowerCase()}_orders_report`}
              />
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3"
              >
                <i className="fas fa-plus"></i>
                <span>Create {activeTab === 'SALE' ? 'Sale Order' : 'Purchase Order'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <ul className="segment-nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'SALE' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('SALE');
              setPage(1);
            }}
          >
            <i className="fas fa-cart-shopping me-1"></i> Sale Orders (Products & Raw Materials)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'PURCHASE' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('PURCHASE');
              setPage(1);
            }}
          >
            <i className="fas fa-truck-ramp-box me-1"></i> Purchase Orders (Raw Materials)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'ALUMINIUM' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ALUMINIUM');
              setPage(1);
            }}
          >
            <i className="fas fa-layer-group me-1"></i> Aluminium Purchases
          </button>
        </li>
      </ul>

      {/* Quick Stats Ribbon */}
      <div className="page-stats-ribbon">
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-primary-subtle text-primary">
            <i className="fas fa-receipt"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{totalCount}</div>
            <div className="stat-ribbon-lbl">Total Records</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-success-subtle text-success">
            <i className="fas fa-circle-check"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{completedCount}</div>
            <div className="stat-ribbon-lbl">Completed</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-warning-subtle text-warning">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{pendingCount}</div>
            <div className="stat-ribbon-lbl">Pending Action</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-info-subtle text-info">
            <i className="fas fa-coins"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{totalSummaryVal}</div>
            <div className="stat-ribbon-lbl">{totalSummaryLabel}</div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card card-custom p-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-3">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-secondary">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder={activeTab === 'ALUMINIUM' ? 'Search supplier, number...' : 'Search order #, party...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {activeTab !== 'ALUMINIUM' && (
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="col-6 col-md-2">
            <input
              type="date"
              className="form-control form-control-sm"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              title="Start Date"
            />
          </div>

          <div className="col-6 col-md-2">
            <input
              type="date"
              className="form-control form-control-sm"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              title="End Date"
            />
          </div>

          <div className="col-12 col-md-1 d-flex gap-1">
            <button type="submit" className="btn btn-primary btn-sm flex-fill">
              Go
            </button>
            {(search || status || warehouseId || startDate || endDate) && (
              <button type="button" onClick={handleClearFilters} className="btn btn-outline-secondary btn-sm" title="Reset">
                <i className="fas fa-rotate-left"></i>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="card card-custom p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading orders..." />
        ) : activeTab === 'ALUMINIUM' ? (
          /* Aluminium Purchases Table */
          aluPurchases.length === 0 ? (
            <EmptyState
              icon="fa-layer-group"
              title="No Aluminium Purchases"
              description="No aluminium purchase records found matching your filters."
              actionBtn={
                <button onClick={() => setShowAluModal(true)} className="btn btn-warning btn-sm text-dark fw-semibold">
                  <i className="fas fa-plus me-1"></i> Record Aluminium Purchase
                </button>
              }
            />
          ) : (
            <div className="table-responsive-custom border-0">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Purchase #</th>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th className="text-center">Quantity (Entered)</th>
                    <th className="text-center">Base Stock (gm)</th>
                    <th className="text-end">Total Cost</th>
                    <th>Status</th>
                    <th className="text-start">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {aluPurchases.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <span className="badge bg-light text-primary border font-monospace px-2 py-1">
                          {a.purchaseNumber}
                        </span>
                      </td>
                      <td>{new Date(a.purchaseDate).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="table-item-avatar bg-warning-subtle text-dark flex-shrink-0">
                            <i className="fas fa-layer-group"></i>
                          </div>
                          <span className="fw-semibold text-dark">{a.supplier || 'Standard Supplier'}</span>
                        </div>
                      </td>
                      <td className="text-center fw-bold">
                        {a.quantityInput} <span className="small text-muted">{a.unitInput}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-warning-subtle text-dark border border-warning-subtle font-monospace px-2 py-1">
                          +{a.quantityGm.toLocaleString()} gm
                        </span>
                      </td>
                      <td className="text-end fw-semibold text-dark font-monospace">
                        {a.totalCost ? `₹ ${Number(a.totalCost).toLocaleString()}` : '-'}
                      </td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="text-end">
                        {a.status === 'Pending' && (
                          <button
                            className="btn btn-success btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-sm"
                            onClick={() => handleCompleteAluPurchase(a._id)}
                            disabled={actionLoading}
                          >
                            <i className="fas fa-check fa-xs"></i> Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Standard Purchase & Sale Orders Table */
          orders.length === 0 ? (
            <EmptyState
              icon="fa-cart-flatbed"
              title={`No ${activeTab === 'SALE' ? 'Sale' : 'Purchase'} Orders Found`}
              description="No order records match your filter criteria."
              actionBtn={
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
                  <i className="fas fa-plus me-1"></i> Create Order
                </button>
              }
            />
          ) : (
            <div className="table-responsive-custom border-0">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Warehouse</th>
                    <th>Party</th>
                    <th className="text-center">Items</th>
                    <th className="text-end">Total Amount</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord._id}>
                      <td>
                        <button
                          className="badge bg-light text-primary border font-monospace px-2 py-1 btn btn-link p-0 text-decoration-none"
                          onClick={() => {
                            setSelectedOrderId(ord._id);
                            setShowDetailModal(true);
                          }}
                          title="Click to view details"
                        >
                          {ord.orderNumber}
                        </button>
                      </td>
                      <td>{new Date(ord.orderDate).toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace me-1">{ord.warehouse?.code}</span>
                        <span className="small text-secondary">{ord.warehouse?.name}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="table-item-avatar bg-primary-subtle text-primary flex-shrink-0">
                            <i className="fas fa-building"></i>
                          </div>
                          <span className="fw-semibold text-dark">{ord.partyName || '-'}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                          {ord.items?.length || 0} line(s)
                        </span>
                      </td>
                      <td className="text-end fw-bold text-dark font-monospace">
                        ₹ {Number(ord.totalAmount || 0).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            className="table-action-btn"
                            onClick={() => {
                              setSelectedOrderId(ord._id);
                              setShowDetailModal(true);
                            }}
                            title="View Order Details"
                          >
                            <i className="fas fa-eye text-primary"></i>
                          </button>
                          {ord.status === 'Pending' && (
                            <>
                              <button
                                className="table-action-btn text-success"
                                onClick={() => handleCompleteOrder(ord._id)}
                                disabled={actionLoading}
                                title="Mark Completed (Update Warehouse Stock)"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="table-action-btn text-danger"
                                onClick={() => handleOpenCancel(ord)}
                                disabled={actionLoading}
                                title="Cancel Order"
                              >
                                <i className="fas fa-ban"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination */}
        {pagination && (
          <div className="p-3 border-top">
            <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderCreateModal
        show={showCreateModal}
        initialType={activeTab === 'ALUMINIUM' ? 'PURCHASE' : activeTab}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchOrders}
      />

      <OrderDetailModal
        show={showDetailModal}
        orderId={selectedOrderId}
        onClose={() => setShowDetailModal(false)}
        onActionSuccess={fetchOrders}
      />

      <ConfirmModal
        show={showCancelModal}
        title="Cancel Order"
        message={`Are you sure you want to cancel order ${cancelTarget?.orderNumber}?`}
        confirmText="Cancel Order"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelModal(false)}
        loading={actionLoading}
      />

      {/* Buy Aluminium Modal */}
      {showAluModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <form onSubmit={handleCreateAluSubmit} className="modal-content shadow">
              <div className="modal-header flex-shrink-0">
                <h5 className="modal-title fw-semibold">
                  <i className="fas fa-layer-group text-warning me-2"></i> Record Aluminium Purchase
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAluModal(false)}
                  disabled={aluModalLoading}
                ></button>
              </div>
              <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">Supplier Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. National Aluminium Corp"
                        value={aluFormData.supplier}
                        onChange={(e) => setAluFormData({ ...aluFormData, supplier: e.target.value })}
                      />
                    </div>

                    <div className="col-7">
                      <label className="form-label small fw-semibold text-secondary">Purchase Quantity *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control"
                        placeholder="e.g. 50"
                        value={aluFormData.quantityInput}
                        onChange={(e) => setAluFormData({ ...aluFormData, quantityInput: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-5">
                      <label className="form-label small fw-semibold text-secondary">Unit *</label>
                      <select
                        className="form-select"
                        value={aluFormData.unitInput}
                        onChange={(e) => setAluFormData({ ...aluFormData, unitInput: e.target.value })}
                      >
                        <option value="kg">Kilograms (kg)</option>
                        <option value="gm">Grams (gm)</option>
                      </select>
                    </div>

                    {aluFormData.quantityInput > 0 && (
                      <div className="col-12">
                        <div className="p-2 bg-light rounded border text-muted small">
                          Converted Base Stock:{' '}
                          <strong className="text-dark">
                            {aluFormData.unitInput === 'kg'
                              ? `${(Number(aluFormData.quantityInput) * 1000).toLocaleString()} gm`
                              : `${Number(aluFormData.quantityInput).toLocaleString()} gm`}
                          </strong>
                        </div>
                      </div>
                    )}

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Price per Unit</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        placeholder="Optional"
                        value={aluFormData.pricePerUnit}
                        onChange={(e) => setAluFormData({ ...aluFormData, pricePerUnit: e.target.value })}
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Purchase Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={aluFormData.purchaseDate}
                        onChange={(e) => setAluFormData({ ...aluFormData, purchaseDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">Notes</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Optional note"
                        value={aluFormData.notes}
                        onChange={(e) => setAluFormData({ ...aluFormData, notes: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="autoCompleteAlu"
                          checked={aluFormData.autoComplete}
                          onChange={(e) => setAluFormData({ ...aluFormData, autoComplete: e.target.checked })}
                        />
                        <label className="form-check-label small fw-semibold text-dark" htmlFor="autoCompleteAlu">
                          Immediately add to Aluminium Inventory & Ledger
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowAluModal(false)}
                    disabled={aluModalLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning text-dark fw-semibold" disabled={aluModalLoading}>
                    {aluModalLoading && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                    <span>Record Purchase</span>
                  </button>
                </div>
              </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrdersHub;
