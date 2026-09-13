import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import TransferCreateModal from './TransferCreateModal';
import TransferDetailModal from './TransferDetailModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import ExportButtons from '../../components/common/ExportButtons';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';

const TransferList = () => {
  const [transfers, setTransfers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [itemType, setItemType] = useState('');
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [destinationWarehouse, setDestinationWarehouse] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        status,
        itemType,
        sourceWarehouse,
        destinationWarehouse,
        startDate,
        endDate,
        page,
        limit: 25
      };
      const res = await api.get('/warehouse-transfers', { params });
      setTransfers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching transfers', err);
    } finally {
      setLoading(false);
    }
  };

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
    fetchTransfers();
  }, [page, status, itemType, sourceWarehouse, destinationWarehouse, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransfers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setItemType('');
    setSourceWarehouse('');
    setDestinationWarehouse('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleCompleteTransfer = async (transferId) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/warehouse-transfers/${transferId}/complete`);
      toast.success(res.data.message || 'Transfer completed and inventory shifted');
      if (showDetailModal) setShowDetailModal(false);
      fetchTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error executing transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCancel = (transfer) => {
    setCancelTarget(transfer);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setActionLoading(true);
      await api.post(`/warehouse-transfers/${cancelTarget._id}/cancel`);
      toast.success(`Transfer ${cancelTarget.transferNumber} cancelled`);
      setShowCancelModal(false);
      if (showDetailModal) setShowDetailModal(false);
      setCancelTarget(null);
      fetchTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling transfer');
    } finally {
      setActionLoading(false);
    }
  };

  // Export Data
  const exportData = [];
  transfers.forEach((t) => {
    const lineItems = t.items && t.items.length > 0
      ? t.items
      : [{ itemType: t.itemType, item: t.item, quantity: t.quantity }];

    lineItems.forEach((it) => {
      exportData.push({
        'Transfer Number': t.transferNumber,
        'Date': new Date(t.transferDate).toLocaleDateString(),
        'Item Type': it.itemType || t.itemType,
        'Item Name': it.item?.name || t.item?.name || 'Item',
        'SKU': it.item?.sku || t.item?.sku || 'N/A',
        'Quantity': it.quantity,
        'From Warehouse': t.sourceWarehouse?.name || 'N/A',
        'To Warehouse': t.destinationWarehouse?.name || 'N/A',
        'Status': t.status,
        'Notes': t.notes || ''
      });
    });
  });

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Warehouse Stock Transfers</h4>
          <p className="text-secondary small mb-0">
            Transfer raw materials and finished products between factory sheds and warehouses
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ExportButtons
            data={exportData}
            title="Warehouse Transfers Audit Report"
            filename="warehouse_transfers"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
          >
            <i className="fas fa-plus"></i>
            <span>Initiate Transfer</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
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
                placeholder="Search transfer #..."
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

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Item Types</option>
              <option value="RawMaterial">Raw Materials</option>
              <option value="Product">Products</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={sourceWarehouse}
              onChange={(e) => {
                setSourceWarehouse(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Source Warehouse</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.code} ({w.name})
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={destinationWarehouse}
              onChange={(e) => {
                setDestinationWarehouse(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Dest Warehouse</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.code} ({w.name})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-1 d-flex gap-1">
            <button type="submit" className="btn btn-primary btn-sm flex-fill">
              Go
            </button>
            {(search || status || itemType || sourceWarehouse || destinationWarehouse || startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-outline-secondary btn-sm"
                title="Reset"
              >
                <i className="fas fa-rotate-left"></i>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Transfers Table */}
      <div className="card card-custom p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading warehouse stock transfers..." />
        ) : transfers.length === 0 ? (
          <EmptyState
            icon="fa-dolly"
            title="No Warehouse Transfers Found"
            description="No transfer movements match your filter parameters."
            actionBtn={
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
                <i className="fas fa-plus me-1"></i> Initiate First Transfer
              </button>
            }
          />
        ) : (
          <div className="table-responsive-custom border-0">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Transfer #</th>
                  <th>Date</th>
                  <th>Item(s) Transferred</th>
                  <th>Type</th>
                  <th className="text-center">Total Quantity</th>
                  <th>From Warehouse</th>
                  <th>To Warehouse</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => {
                  const hasMulti = t.items && t.items.length > 1;
                  const firstItemObj = t.items?.[0]?.item || t.item;
                  const totalUnits = t.items && t.items.length > 0
                    ? t.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
                    : (Number(t.quantity) || 0);

                  const isAllRM = t.items?.every((i) => i.itemType === 'RawMaterial');
                  const isAllProd = t.items?.every((i) => i.itemType === 'Product');

                  return (
                    <tr key={t._id}>
                      <td>
                        <button
                          className="btn btn-link btn-sm fw-bold p-0 text-decoration-none text-primary"
                          onClick={() => {
                            setSelectedTransfer(t);
                            setShowDetailModal(true);
                          }}
                          title="View transfer items"
                        >
                          {t.transferNumber}
                        </button>
                      </td>
                      <td>{new Date(t.transferDate).toLocaleDateString()}</td>
                      <td>
                        {hasMulti ? (
                          <div>
                            <div className="fw-semibold text-dark">
                              {firstItemObj?.name || 'Item'}
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-1">
                                +{t.items.length - 1} more
                              </span>
                            </div>
                            <span className="badge bg-light text-dark border font-monospace">
                              {firstItemObj?.sku || 'N/A'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="fw-semibold text-dark">{firstItemObj?.name || 'Item'}</div>
                            <span className="badge bg-light text-dark border font-monospace">
                              {firstItemObj?.sku || 'N/A'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        {hasMulti ? (
                          <span className="badge bg-dark-subtle text-dark border">
                            {isAllRM ? 'Raw Materials' : isAllProd ? 'Products' : 'Mixed'} ({t.items.length})
                          </span>
                        ) : (
                          <span
                            className={`badge ${
                              (t.items?.[0]?.itemType || t.itemType) === 'RawMaterial'
                                ? 'bg-info-subtle text-info-emphasis border border-info-subtle'
                                : 'bg-primary-subtle text-primary border border-primary-subtle'
                            }`}
                          >
                            {(t.items?.[0]?.itemType || t.itemType) === 'RawMaterial'
                              ? 'Raw Material'
                              : 'Product'}
                          </span>
                        )}
                      </td>
                      <td className="text-center fw-bold fs-6 text-dark">
                        {totalUnits.toLocaleString()}
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border">
                          {t.sourceWarehouse?.code} ({t.sourceWarehouse?.name})
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-primary border">
                          {t.destinationWarehouse?.code} ({t.destinationWarehouse?.name})
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setSelectedTransfer(t);
                              setShowDetailModal(true);
                            }}
                            title="View Transfer Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          {t.status === 'Pending' && (
                            <>
                              <button
                                className="btn btn-outline-success"
                                onClick={() => handleCompleteTransfer(t._id)}
                                disabled={actionLoading}
                                title="Execute Transfer & Shift Stock"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleOpenCancel(t)}
                                disabled={actionLoading}
                                title="Cancel Transfer"
                              >
                                <i className="fas fa-ban"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="p-3 border-top">
            <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
          </div>
        )}
      </div>

      {/* Modals */}
      <TransferCreateModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTransfers}
      />

      <TransferDetailModal
        show={showDetailModal}
        transfer={selectedTransfer}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTransfer(null);
        }}
        onComplete={handleCompleteTransfer}
        onCancel={handleOpenCancel}
        actionLoading={actionLoading}
      />

      <ConfirmModal
        show={showCancelModal}
        title="Cancel Warehouse Transfer"
        message={`Are you sure you want to cancel transfer "${cancelTarget?.transferNumber}"?`}
        confirmText="Cancel Transfer"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelModal(false)}
        loading={actionLoading}
      />
    </div>
  );
};

export default TransferList;
