import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ExportButtons from '../../components/common/ExportButtons';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const WarehouseInventory = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [itemType, setItemType] = useState('Product'); // 'Product' | 'RawMaterial'
  const [inventoryList, setInventoryList] = useState([]);
  const [summary, setSummary] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Warehouses & Summary
  const loadWarehouses = async () => {
    try {
      const [whRes, sumRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/warehouse-inventory/summary')
      ]);
      setWarehouses(whRes.data.data);
      setSummary(sumRes.data.data);
      if (whRes.data.data.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(whRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading warehouse data', err);
    }
  };

  // Fetch Inventory for selected warehouse & type
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {
        warehouseId: selectedWarehouseId,
        itemType,
        search,
        page,
        limit: 25
      };
      const res = await api.get('/warehouse-inventory', { params });
      setInventoryList(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching warehouse inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouseId) {
      fetchInventory();
    }
  }, [selectedWarehouseId, itemType, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  // Export Data
  const exportData = inventoryList.map((inv) => ({
    'Warehouse': inv.warehouse?.name,
    'Warehouse Code': inv.warehouse?.code,
    'Item Type': inv.itemType,
    'Item Name': inv.item?.name,
    'SKU': inv.item?.sku,
    'Category': inv.item?.category,
    'Current Stock': inv.currentStock,
    'Reserved Stock': inv.reservedStock,
    'Available Stock': Math.max(0, inv.currentStock - inv.reservedStock),
    'Unit': inv.item?.unit || 'Pcs',
    'Last Updated': new Date(inv.updatedAt).toLocaleDateString()
  }));

  const selectedWh = warehouses.find((w) => w._id === selectedWarehouseId);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="page-header-icon bg-info text-white shadow-sm">
            <i className="fas fa-warehouse"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="page-header-title mb-0">Warehouse Stock Balances</h4>
              <span className="page-context-pill">Multi-Facility</span>
            </div>
            <p className="page-header-subtitle mb-0">
              Multi-location inventory tracking across manufacturing sheds and distribution facilities
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ExportButtons
            data={exportData}
            title={`Warehouse Stock - ${selectedWh?.name || 'All Warehouses'}`}
            filename="warehouse_inventory"
          />
        </div>
      </div>

      {/* Warehouse Facility Cards Summary */}
      <div className="row g-3">
        {summary.map((wh, idx) => {
          const isSelected = selectedWarehouseId === wh.warehouseId;
          const totalStock = (wh.totalProductsStock || 0) + (wh.totalRawMaterialsStock || 0);
          const prodPercent = totalStock > 0 ? Math.round(((wh.totalProductsStock || 0) / totalStock) * 100) : 0;
          const rawPercent = totalStock > 0 ? 100 - prodPercent : 0;

          // Distinct icon palette
          const palettes = [
            { bg: 'bg-primary-subtle', text: 'text-primary', border: 'border-primary-subtle', icon: 'fa-industry' },
            { bg: 'bg-info-subtle', text: 'text-info', border: 'border-info-subtle', icon: 'fa-warehouse' },
            { bg: 'bg-success-subtle', text: 'text-success', border: 'border-success-subtle', icon: 'fa-dolly-flatbed' }
          ];
          const pal = palettes[idx % palettes.length];

          return (
            <div key={wh.warehouseId} className="col-12 col-md-4">
              <div
                className={`warehouse-card p-3 cursor-pointer ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedWarehouseId(wh.warehouseId);
                  setPage(1);
                }}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`warehouse-card-icon ${pal.bg} ${pal.text} ${pal.border} border`}>
                      <i className={`fas ${pal.icon}`}></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="fw-bold text-dark mb-0">{wh.name}</h6>
                        <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.72rem' }}>
                          {wh.code}
                        </span>
                      </div>
                      <div className="text-secondary small mt-1 text-truncate" style={{ maxWidth: '180px' }}>
                        <i className="fas fa-map-marker-alt fa-xs me-1 text-muted"></i>
                        {wh.address || 'Factory Shed & Storage'}
                      </div>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="badge bg-primary text-white shadow-sm px-2 py-1">
                      <i className="fas fa-check-circle me-1"></i> Active
                    </span>
                  ) : (
                    <span className="badge bg-light text-muted border px-2 py-1">
                      Select
                    </span>
                  )}
                </div>

                {/* Stock Ratio Progress Bar */}
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center small text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                    <span>Products ({prodPercent}%)</span>
                    <span>Raw Materials ({rawPercent}%)</span>
                  </div>
                  <div className="warehouse-progress-track">
                    <div
                      className="bg-primary"
                      style={{ width: `${prodPercent}%` }}
                      title={`Products: ${prodPercent}%`}
                    ></div>
                    <div
                      className="bg-info"
                      style={{ width: `${rawPercent}%` }}
                      title={`Raw Materials: ${rawPercent}%`}
                    ></div>
                  </div>
                </div>

                {/* Metrics Breakdown Tiles */}
                <div className="row g-2 mt-1">
                  <div className="col-6">
                    <div className="warehouse-stat-box">
                      <div className="d-flex align-items-center gap-1 text-secondary small" style={{ fontSize: '0.75rem' }}>
                        <i className="fas fa-box text-primary"></i> Products
                      </div>
                      <div className="fw-bold text-dark fs-6 mt-1">
                        {wh.totalProductsStock.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="warehouse-stat-box">
                      <div className="d-flex align-items-center gap-1 text-secondary small" style={{ fontSize: '0.75rem' }}>
                        <i className="fas fa-cubes text-info"></i> Raw Mat.
                      </div>
                      <div className="fw-bold text-dark fs-6 mt-1">
                        {wh.totalRawMaterialsStock.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Stock Footer */}
                <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center">
                  <span className="text-secondary small fw-medium">Total Inventory</span>
                  <span className="fw-bold text-primary font-monospace">
                    {totalStock.toLocaleString()} <span className="small fw-normal text-muted">units</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Facility Selector & Item Type Filters */}
      <div className="card card-custom p-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          {/* Item Type Switcher */}
          <div className="btn-group btn-group-sm p-1 bg-light rounded-pill border" role="group">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${itemType === 'Product' ? 'btn-primary shadow-sm' : 'btn-light text-secondary border-0'}`}
              onClick={() => {
                setItemType('Product');
                setPage(1);
              }}
            >
              <i className="fas fa-boxes-stacked me-1"></i> Finished Products
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${itemType === 'RawMaterial' ? 'btn-primary shadow-sm' : 'btn-light text-secondary border-0'}`}
              onClick={() => {
                setItemType('RawMaterial');
                setPage(1);
              }}
            >
              <i className="fas fa-cubes me-1"></i> Raw Materials
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
            <div className="input-group input-group-sm" style={{ minWidth: '260px' }}>
              <span className="input-group-text bg-light text-secondary">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder={`Search ${itemType === 'Product' ? 'products' : 'raw materials'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm px-3">
              Search
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
              >
                Reset
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card card-custom p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Querying warehouse stock balances..." />
        ) : inventoryList.length === 0 ? (
          <EmptyState
            icon="fa-warehouse"
            title="No Items Found in this Warehouse"
            description="No inventory records found for this category in the selected facility."
          />
        ) : (
          <div className="table-responsive-custom border-0">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="text-center">Current Stock</th>
                  <th className="text-center">Reserved Stock</th>
                  <th className="text-center">Available Stock</th>
                  <th>Unit</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {inventoryList.map((inv) => {
                  const available = Math.max(0, inv.currentStock - inv.reservedStock);
                  const isProd = inv.itemType === 'Product';
                  return (
                    <tr key={inv._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className={`table-item-avatar ${isProd ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'} flex-shrink-0`}>
                            <i className={`fas ${isProd ? 'fa-box' : 'fa-cube'}`}></i>
                          </div>
                          <span className="fw-semibold text-dark">{inv.item?.name || 'Deleted Item'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace px-2 py-1">
                          {inv.item?.sku || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                          {inv.item?.category || '-'}
                        </span>
                      </td>
                      <td className="text-center fw-bold fs-6 text-dark">{inv.currentStock.toLocaleString()}</td>
                      <td className="text-center text-muted font-monospace">{inv.reservedStock.toLocaleString()}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            available > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                          } fw-bold px-2 py-1`}
                        >
                          {available.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-muted small">{inv.item?.unit || 'Pcs'}</td>
                      <td className="text-muted small">{new Date(inv.updatedAt).toLocaleDateString()}</td>
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
    </div>
  );
};

export default WarehouseInventory;
