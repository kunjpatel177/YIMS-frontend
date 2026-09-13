import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import MetricCard from '../../components/common/MetricCard';
import ExportButtons from '../../components/common/ExportButtons';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { toast } from 'react-toastify';

const AluminiumHub = () => {
  const [activeTab, setActiveTab] = useState('production'); // 'production' | 'overview' | 'ledger' | 'history'
  const [inventory, setInventory] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [productions, setProductions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Production Form State
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [productionQuantity, setProductionQuantity] = useState('');
  const [wastageGm, setWastageGm] = useState('0');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submittingProduction, setSubmittingProduction] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Ledger & History Filter State
  const [ledgerType, setLedgerType] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Load Aluminium Inventory
  const fetchInventory = async () => {
    try {
      const res = await api.get('/aluminium/inventory');
      setInventory(res.data.data);
    } catch (err) {
      console.error('Error loading aluminium inventory', err);
    }
  };

  // Load Raw Materials that use aluminium
  const fetchAluminiumMaterials = async () => {
    try {
      const res = await api.get('/raw-materials?usesAluminium=true&limit=300');
      setMaterials(res.data.data);
      if (res.data.data.length > 0 && !selectedMaterialId) {
        setSelectedMaterialId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading aluminium materials', err);
    }
  };

  // Load Aluminium Ledger
  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = {
        transactionType: ledgerType,
        page: ledgerPage,
        limit: 25
      };
      const res = await api.get('/aluminium/ledger', { params });
      setLedger(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error loading aluminium ledger', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Production History
  const fetchProductions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/aluminium/productions', {
        params: { page: historyPage, limit: 25 }
      });
      setProductions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error loading aluminium productions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchAluminiumMaterials();
  }, []);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchLedger();
    } else if (activeTab === 'history') {
      fetchProductions();
    }
  }, [activeTab, ledgerType, ledgerPage, historyPage]);

  // Selected Material Object
  const selectedMaterial = materials.find((m) => m._id === selectedMaterialId);

  // Dynamic calculations for production form
  const aluPerUnitGm = selectedMaterial
    ? selectedMaterial.aluminiumUnit === 'kg'
      ? (selectedMaterial.aluminiumRequiredPerUnit || 0) * 1000
      : selectedMaterial.aluminiumRequiredPerUnit || 0
    : 0;

  const totalRequiredGm = (Number(productionQuantity) || 0) * aluPerUnitGm;
  const wastageNum = Number(wastageGm) || 0;
  const totalDeductionGm = totalRequiredGm + wastageNum;
  const currentAvailableGm = inventory?.availableGm || 0;
  const remainingGm = currentAvailableGm - totalDeductionGm;
  const isSufficient = currentAvailableGm >= totalDeductionGm && totalRequiredGm > 0;

  const handleProductionFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedMaterialId) {
      toast.error('Please select a raw material to manufacture');
      return;
    }
    if (!productionQuantity || Number(productionQuantity) <= 0) {
      toast.error('Production quantity must be greater than zero');
      return;
    }
    if (!isSufficient) {
      toast.error('Insufficient aluminium stock to fulfill this production run!');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeProduction = async () => {
    try {
      setSubmittingProduction(true);
      const res = await api.post('/aluminium/production', {
        rawMaterialId: selectedMaterialId,
        productionQuantity: Number(productionQuantity),
        wastageGm: wastageNum,
        productionDate,
        notes
      });

      toast.success(
        `Manufactured ${productionQuantity} ${selectedMaterial?.unit} of "${selectedMaterial?.name}". Deposited into Warehouse 1!`
      );
      setShowConfirmModal(false);
      setProductionQuantity('');
      setWastageGm('0');
      setNotes('');
      fetchInventory();
      if (activeTab === 'history') fetchProductions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to execute aluminium production';
      toast.error(msg);
    } finally {
      setSubmittingProduction(false);
    }
  };

  // Export datasets
  const ledgerExportData = ledger.map((l) => ({
    'Date': new Date(l.date).toLocaleDateString(),
    'Tx Number': l.transactionNumber,
    'Type': l.transactionType,
    'Aluminium In (gm)': l.aluminiumInGm || 0,
    'Aluminium Used (gm)': l.aluminiumUsedGm || 0,
    'Wastage (gm)': l.wastageGm || 0,
    'Running Balance (gm)': l.balanceGm,
    'Balance (kg)': (l.balanceGm / 1000).toFixed(2),
    'Reference': l.reference || '',
    'Notes': l.notes || ''
  }));

  const historyExportData = productions.map((p) => ({
    'Production Number': p.productionNumber,
    'Date': new Date(p.productionDate).toLocaleDateString(),
    'Raw Material': p.rawMaterial?.name,
    'Quantity Produced': p.productionQuantity,
    'Alu / Unit (gm)': p.aluminiumPerUnitGm,
    'Total Alu Used (gm)': p.totalAluminiumUsedGm,
    'Wastage (gm)': p.wastageGm,
    'Destination Warehouse': p.warehouse?.name || 'Warehouse 1',
    'Status': p.status,
    'Notes': p.notes || ''
  }));

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Aluminium Management & Production</h4>
          <p className="text-secondary small mb-0">
            Dedicated lifecycle tracking for core manufacturing aluminium, production conversion, and ledger
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {activeTab === 'ledger' && (
            <ExportButtons
              data={ledgerExportData}
              title="Aluminium Audit Ledger"
              filename="aluminium_ledger"
            />
          )}
          {activeTab === 'history' && (
            <ExportButtons
              data={historyExportData}
              title="Aluminium Production History"
              filename="aluminium_production_history"
            />
          )}
        </div>
      </div>

      {/* KPI Balance Banner */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-custom p-3 bg-warning-subtle border border-warning-subtle">
            <div className="text-dark small fw-semibold text-uppercase">Available Aluminium Balance</div>
            <div className="fs-3 fw-bold text-dark mt-1">
              {(currentAvailableGm / 1000).toFixed(2)} <span className="fs-6 fw-normal text-muted">kg</span>
            </div>
            <div className="small text-muted">{currentAvailableGm.toLocaleString()} gm base stock</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-custom p-3">
            <div className="text-secondary small fw-semibold text-uppercase">Opening Stock</div>
            <div className="fs-4 fw-bold text-dark mt-1">
              {((inventory?.openingStockGm || 0) / 1000).toFixed(2)} <span className="fs-6 fw-normal text-muted">kg</span>
            </div>
            <div className="small text-muted">{(inventory?.openingStockGm || 0).toLocaleString()} gm base</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-custom p-3">
            <div className="text-secondary small fw-semibold text-uppercase">Total Purchased</div>
            <div className="fs-4 fw-bold text-info mt-1">
              +{((inventory?.purchasedGm || 0) / 1000).toFixed(2)} <span className="fs-6 fw-normal text-muted">kg</span>
            </div>
            <div className="small text-muted">{(inventory?.purchasedGm || 0).toLocaleString()} gm procured</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-custom p-3">
            <div className="text-secondary small fw-semibold text-uppercase">Production Used + Scrap</div>
            <div className="fs-4 fw-bold text-danger mt-1">
              -{(((inventory?.usedGm || 0) + (inventory?.wastageGm || 0)) / 1000).toFixed(2)}{' '}
              <span className="fs-6 fw-normal text-muted">kg</span>
            </div>
            <div className="small text-danger">{(inventory?.wastageGm || 0).toLocaleString()} gm scrap</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills border-bottom pb-2">
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'production' ? 'active' : ''}`}
            onClick={() => setActiveTab('production')}
          >
            <i className="fas fa-hammer me-1"></i> Aluminium Production Form
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('history');
              setHistoryPage(1);
            }}
          >
            <i className="fas fa-clock-rotate-left me-1"></i> Production History
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ledger');
              setLedgerPage(1);
            }}
          >
            <i className="fas fa-book-open me-1"></i> Aluminium Audit Ledger
          </button>
        </li>
      </ul>

      {/* Tab 1: Aluminium Production Form */}
      {activeTab === 'production' && (
        <div className="row g-3">
          <div className="col-12 col-lg-7">
            <div className="card card-custom p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="fas fa-industry text-primary me-2"></i> Manufacture Raw Material
                </h5>
                <span className="badge bg-warning text-dark">Aluminium Consumer</span>
              </div>
              <p className="text-secondary small mb-4">
                Select an aluminium-based component to produce. The system automatically computes the required
                aluminium and deposits the finished raw material strictly into <strong>Warehouse 1</strong>.
              </p>

              <form onSubmit={handleProductionFormSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Target Raw Material (Aluminium-based) *
                    </label>
                    <select
                      className="form-select"
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      required
                    >
                      {materials.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.sku}) • Req: {m.aluminiumRequiredPerUnit} {m.aluminiumUnit}/unit
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Production Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      placeholder="e.g. 100"
                      value={productionQuantity}
                      onChange={(e) => setProductionQuantity(e.target.value)}
                      required
                    />
                    <div className="small text-muted mt-1">Number of units to manufacture</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Wastage / Scrap (Optional gm)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      placeholder="0"
                      value={wastageGm}
                      onChange={(e) => setWastageGm(e.target.value)}
                    />
                    <div className="small text-muted mt-1">Scrap or trimmings generated during casting</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">Production Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={productionDate}
                      onChange={(e) => setProductionDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Destination Warehouse strictly locked to Warehouse 1 */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Destination Warehouse (Locked by Business Rule)
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-secondary">
                        <i className="fas fa-lock"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value="Warehouse 1 (Main Factory Hub)"
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">Production Notes / Batch #</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Batch #409, die casting line 2"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
                    disabled={!isSufficient}
                  >
                    <i className="fas fa-gears"></i>
                    <span>Execute Production</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Interactive Live Calculation Card */}
          <div className="col-12 col-lg-5">
            <div className="card card-custom p-4 h-100">
              <h6 className="fw-bold text-dark mb-3">
                <i className="fas fa-calculator text-info me-2"></i> Live Requirement Preview
              </h6>

              <div className="d-flex flex-column gap-3">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-secondary small fw-semibold">Configured Aluminium per Unit</div>
                  <div className="fs-5 fw-bold text-dark">
                    {aluPerUnitGm} <span className="fs-6 fw-normal text-muted">gm / unit</span>
                  </div>
                  <div className="small text-muted">{selectedMaterial?.name || 'Selected Component'}</div>
                </div>

                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-secondary small fw-semibold">Total Aluminium Required</div>
                  <div className="fs-4 fw-bold text-primary">
                    {totalRequiredGm.toLocaleString()} <span className="fs-6 fw-normal text-muted">gm</span>
                    <span className="small text-muted ms-2">({(totalRequiredGm / 1000).toFixed(2)} kg)</span>
                  </div>
                  <div className="small text-muted">
                    Formula: {productionQuantity || 0} units &times; {aluPerUnitGm} gm/unit
                  </div>
                </div>

                {wastageNum > 0 && (
                  <div className="p-2 bg-danger-subtle rounded border border-danger-subtle small text-danger">
                    <i className="fas fa-exclamation-circle me-1"></i> Plus {wastageNum.toLocaleString()} gm scrap / wastage
                  </div>
                )}

                <div className="p-3 rounded-3 border border-2 border-dashed">
                  <div className="d-flex justify-content-between text-secondary small">
                    <span>Available Aluminium:</span>
                    <strong className="text-dark">{currentAvailableGm.toLocaleString()} gm</strong>
                  </div>
                  <div className="d-flex justify-content-between text-danger small mt-1">
                    <span>Total Deducted:</span>
                    <strong>-{totalDeductionGm.toLocaleString()} gm</strong>
                  </div>
                  <div className="d-flex justify-content-between small mt-2 pt-2 border-top">
                    <span className="fw-semibold">Remaining Balance:</span>
                    <strong className={remainingGm >= 0 ? 'text-success' : 'text-danger'}>
                      {remainingGm.toLocaleString()} gm ({(remainingGm / 1000).toFixed(2)} kg)
                    </strong>
                  </div>
                </div>

                {/* Status Indicator */}
                {totalRequiredGm > 0 && (
                  <div
                    className={`alert ${
                      isSufficient ? 'alert-success' : 'alert-danger'
                    } mb-0 d-flex align-items-center gap-2`}
                  >
                    <i className={`fas ${isSufficient ? 'fa-check-circle' : 'fa-times-circle'} fa-lg`}></i>
                    <div className="small">
                      {isSufficient ? (
                        <strong>Sufficient Aluminium. Ready to manufacture.</strong>
                      ) : (
                        <strong>Insufficient Aluminium! Need {(totalDeductionGm - currentAvailableGm).toLocaleString()} gm more.</strong>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Production History */}
      {activeTab === 'history' && (
        <div className="card card-custom p-0 overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading production history..." />
          ) : productions.length === 0 ? (
            <EmptyState
              icon="fa-clock-rotate-left"
              title="No Production Runs Recorded"
              description="Manufacture components using the Aluminium Production Form to populate history."
              actionBtn={
                <button onClick={() => setActiveTab('production')} className="btn btn-primary btn-sm">
                  Go to Production Form
                </button>
              }
            />
          ) : (
            <div className="table-responsive-custom border-0">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Production #</th>
                    <th>Date</th>
                    <th>Raw Material Produced</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Alu / Unit</th>
                    <th className="text-center">Total Aluminium Used</th>
                    <th className="text-center">Scrap / Wastage</th>
                    <th>Destination</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((p) => (
                    <tr key={p._id}>
                      <td className="fw-semibold text-primary">{p.productionNumber}</td>
                      <td>{new Date(p.productionDate).toLocaleDateString()}</td>
                      <td className="fw-semibold text-dark">{p.rawMaterial?.name}</td>
                      <td className="text-center fw-bold">
                        {p.productionQuantity} {p.rawMaterial?.unit}
                      </td>
                      <td className="text-center">{p.aluminiumPerUnitGm} gm</td>
                      <td className="text-center text-danger fw-semibold">
                        -{p.totalAluminiumUsedGm.toLocaleString()} gm
                      </td>
                      <td className="text-center text-muted">
                        {p.wastageGm > 0 ? `${p.wastageGm} gm` : '-'}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="fas fa-lock me-1"></i> {p.warehouse?.name || 'Warehouse 1'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success text-white">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && (
            <div className="p-3 border-top">
              <Pagination pagination={pagination} onPageChange={(p) => setHistoryPage(p)} />
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Aluminium Audit Ledger */}
      {activeTab === 'ledger' && (
        <div className="d-flex flex-column gap-3">
          <div className="card card-custom p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-secondary mb-1">Filter Transaction Type</label>
                <select
                  className="form-select form-select-sm"
                  value={ledgerType}
                  onChange={(e) => {
                    setLedgerType(e.target.value);
                    setLedgerPage(1);
                  }}
                >
                  <option value="">All Transactions</option>
                  <option value="Opening Stock">Opening Stock</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Production Consumption">Production Consumption</option>
                  <option value="Wastage/Scrap">Wastage / Scrap</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card card-custom p-0 overflow-hidden">
            {loading ? (
              <LoadingSpinner message="Retrieving aluminium audit ledger transactions..." />
            ) : ledger.length === 0 ? (
              <EmptyState title="No Ledger Entries Found" description="No transactions recorded yet." />
            ) : (
              <div className="table-responsive-custom border-0">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Tx #</th>
                      <th>Type</th>
                      <th className="text-center">Aluminium In</th>
                      <th className="text-center">Aluminium Used</th>
                      <th className="text-center">Wastage</th>
                      <th className="text-end">Balance (gm)</th>
                      <th className="text-end">Balance (kg)</th>
                      <th>Reference & Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((l) => (
                      <tr key={l._id}>
                        <td>{new Date(l.date).toLocaleDateString()}</td>
                        <td className="fw-semibold text-primary">{l.transactionNumber}</td>
                        <td>
                          <span
                            className={`badge ${
                              l.transactionType === 'Purchase'
                                ? 'bg-success-subtle text-success'
                                : l.transactionType === 'Production Consumption'
                                ? 'bg-primary-subtle text-primary'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {l.transactionType}
                          </span>
                        </td>
                        <td className="text-center text-success fw-semibold">
                          {l.aluminiumInGm > 0 ? `+${l.aluminiumInGm.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-center text-danger fw-semibold">
                          {l.aluminiumUsedGm > 0 ? `-${l.aluminiumUsedGm.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-center text-warning fw-semibold">
                          {l.wastageGm > 0 ? `-${l.wastageGm.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-end fw-bold text-dark">{l.balanceGm.toLocaleString()} gm</td>
                        <td className="text-end text-muted font-monospace">{(l.balanceGm / 1000).toFixed(2)} kg</td>
                        <td className="small text-muted text-truncate" style={{ maxWidth: '250px' }} title={l.notes}>
                          {l.notes || l.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination && (
              <div className="p-3 border-top">
                <Pagination pagination={pagination} onPageChange={(p) => setLedgerPage(p)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        show={showConfirmModal}
        title="Confirm Aluminium Production"
        message={`Confirm manufacturing ${productionQuantity} ${selectedMaterial?.unit} of "${selectedMaterial?.name}". This will deduct ${totalDeductionGm.toLocaleString()} gm of aluminium from Aluminium Inventory and credit ${productionQuantity} units to Warehouse 1.`}
        confirmText="Confirm & Manufacture"
        confirmBtnClass="btn-primary"
        onConfirm={executeProduction}
        onCancel={() => setShowConfirmModal(false)}
        loading={submittingProduction}
      />
    </div>
  );
};

export default AluminiumHub;
