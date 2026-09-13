import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ExportButtons from '../../components/common/ExportButtons';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';

const ReportsHub = () => {
  const [reportType, setReportType] = useState('sales'); // 'sales' | 'purchases' | 'inventory' | 'low-stock' | 'capacity' | 'transfers' | 'aluminium'
  const [data, setData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Fetch Warehouses
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

  // Fetch Report Data based on active tab and filters
  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        warehouseId,
        startDate,
        endDate,
        status
      };
      const res = await api.get(`/reports/${reportType}`, { params });
      setData(res.data.data || []);
    } catch (err) {
      console.error('Error fetching report', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, warehouseId, startDate, endDate, status]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [reportType, warehouseId, startDate, endDate, status, pageSize]);

  const handleClearFilters = () => {
    setWarehouseId('');
    setStartDate('');
    setEndDate('');
    setStatus('');
    setPage(1);
  };

  // Dynamically extract columns / headers for export and display
  // Never expose internal database IDs (e.g. productId, rawMaterialId, _id)
  const getHeadersAndRows = () => {
    if (!data || data.length === 0) return { headers: [], rows: [] };
    const first = data[0];
    const headers = Object.keys(first).filter(
      (k) =>
        k !== '_id' &&
        k !== '__v' &&
        k !== 'productId' &&
        k !== 'rawMaterialId' &&
        k !== 'warehouseId' &&
        !k.toLowerCase().endsWith('id')
    );
    const rows = data.map((item) => {
      const row = {};
      headers.forEach((h) => {
        row[h] = item[h] !== undefined && item[h] !== null ? item[h] : '';
      });
      return row;
    });
    return { headers, rows };
  };

  const { headers: exportHeaders, rows: exportRows } = getHeadersAndRows();

  const reportTitles = {
    sales: 'Sales Performance & Dispatches Report',
    purchases: 'Raw Material Procurement Report',
    inventory: 'Consolidated Warehouse Inventory Report',
    'low-stock': 'Low Stock & Reorder Alert Report',
    capacity: 'BOM Bottleneck & Manufacturing Capacity Report',
    transfers: 'Warehouse Stock Transfers Audit Report',
    aluminium: 'Aluminium Inventory & Production Consumption Report'
  };

  const total = data.length;
  const pages = Math.ceil(total / pageSize) || 1;
  const paginatedRows = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Manufacturing & Inventory Reports</h4>
          <p className="text-secondary small mb-0">
            Comprehensive audit reports with exportable CSV, Excel, and PDF formats
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ExportButtons
            data={exportRows}
            headers={exportHeaders}
            title={reportTitles[reportType] || 'Report'}
            filename={`${reportType}_report`}
          />
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <ul className="nav nav-pills border-bottom pb-2 flex-nowrap overflow-x-auto">
        <li className="nav-item text-nowrap">
          <button
            className={`nav-link btn-sm ${reportType === 'sales' ? 'active' : ''}`}
            onClick={() => {
              setReportType('sales');
              setPage(1);
            }}
          >
            <i className="fas fa-cart-shopping me-1"></i> Sales Report
          </button>
        </li>
        <li className="nav-item text-nowrap">
          <button
            className={`nav-link btn-sm ${reportType === 'purchases' ? 'active' : ''}`}
            onClick={() => {
              setReportType('purchases');
              setPage(1);
            }}
          >
            <i className="fas fa-truck me-1"></i> Purchases Report
          </button>
        </li>
        <li className="nav-item text-nowrap">
          <button
            className={`nav-link btn-sm ${reportType === 'inventory' ? 'active' : ''}`}
            onClick={() => {
              setReportType('inventory');
              setPage(1);
            }}
          >
            <i className="fas fa-boxes-stacked me-1"></i> Stock Balances
          </button>
        </li>
        <li className="nav-item text-nowrap">
          <button
            className={`nav-link btn-sm ${reportType === 'low-stock' ? 'active' : ''}`}
            onClick={() => {
              setReportType('low-stock');
              setPage(1);
            }}
          >
            <i className="fas fa-triangle-exclamation me-1"></i> Low Stock Alerts
          </button>
        </li>
        <li className="nav-item text-nowrap">
          <button
            className={`nav-link btn-sm ${reportType === 'capacity' ? 'active' : ''}`}
            onClick={() => {
              setReportType('capacity');
              setPage(1);
            }}
          >
            <i className="fas fa-industry me-1"></i> BOM Capacity
          </button>
        </li>
        <li className="nav-item text-nowrap">
          <button
            className={`nav-link btn-sm ${reportType === 'transfers' ? 'active' : ''}`}
            onClick={() => {
              setReportType('transfers');
              setPage(1);
            }}
          >
            <i className="fas fa-dolly me-1"></i> Transfers Report
          </button>
        </li>
        <li className="nav-item text-nowrap">
          <button
            className={`nav-link btn-sm ${reportType === 'aluminium' ? 'active' : ''}`}
            onClick={() => {
              setReportType('aluminium');
              setPage(1);
            }}
          >
            <i className="fas fa-layer-group me-1"></i> Aluminium Ledger
          </button>
        </li>
      </ul>

      {/* Filters Bar */}
      <div className="card card-custom p-3">
        <div className="row g-2 align-items-center">
          {['sales', 'purchases'].includes(reportType) && (
            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold text-secondary mb-1">Warehouse Filter</label>
              <select
                className="form-select form-select-sm"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
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

          {['sales', 'purchases', 'transfers'].includes(reportType) && (
            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold text-secondary mb-1">Status</label>
              <select
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">From Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-secondary mb-1">To Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {(warehouseId || startDate || endDate || status) && (
          <div className="mt-2 pt-2 border-top d-flex justify-content-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            >
              <i className="fas fa-rotate-left fa-xs"></i> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Report Data Display Table */}
      <div className="card card-custom p-0 overflow-hidden">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
          <h6 className="fw-bold text-dark mb-0">{reportTitles[reportType]}</h6>
          <span className="badge bg-secondary">{total} Total Records</span>
        </div>

        {loading ? (
          <LoadingSpinner message="Generating real-time audit report..." />
        ) : data.length === 0 ? (
          <EmptyState
            title="No Records Found"
            description="No transactions match the selected report parameters and date range."
          />
        ) : (
          <>
            <div className="table-responsive-custom border-0">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    {exportHeaders.map((h) => (
                      <th key={h} className="text-capitalize">
                        {h.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, idx) => (
                    <tr key={idx}>
                      {exportHeaders.map((h) => {
                        const val = row[h];
                        if (h === 'status' || h === 'reorderStatus') {
                          return (
                            <td key={h}>
                              <StatusBadge status={val} />
                            </td>
                          );
                        }
                        if (typeof val === 'number') {
                          return (
                            <td key={h} className="fw-semibold">
                              {val.toLocaleString()}
                            </td>
                          );
                        }
                        return (
                          <td key={h} className="text-secondary">
                            {val !== undefined && val !== null ? String(val) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {total > 0 && (
              <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2 bg-light-subtle">
                <div className="d-flex align-items-center gap-2 small text-secondary">
                  <span>Rows per page:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="ms-2">
                    Showing {Math.min((page - 1) * pageSize + 1, total)} &ndash;{' '}
                    {Math.min(page * pageSize, total)} of {total} records
                  </span>
                </div>
                <Pagination
                  pagination={{
                    page,
                    pages,
                    total,
                    limit: pageSize
                  }}
                  onPageChange={(newPage) => setPage(newPage)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsHub;
