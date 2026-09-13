import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RawMaterialModal from './RawMaterialModal';
import RawMaterialDetailModal from './RawMaterialDetailModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import ExportButtons from '../../components/common/ExportButtons';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';

const RawMaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [reorderFilter, setReorderFilter] = useState('');
  const [usesAluminium, setUsesAluminium] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailMaterialId, setDetailMaterialId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search,
        category,
        reorderFilter,
        usesAluminium
      };
      const res = await api.get('/raw-materials', { params });
      setMaterials(res.data.data);
      setPagination(res.data.pagination);
      setCategories(res.data.categories || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [page, category, reorderFilter, usesAluminium]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMaterials();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setReorderFilter('');
    setUsesAluminium('');
    setPage(1);
  };

  const handleOpenAdd = () => {
    setSelectedMaterial(null);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (mat) => {
    setSelectedMaterial(mat);
    setShowAddEditModal(true);
  };

  const handleOpenDetails = (id) => {
    setDetailMaterialId(id);
    setShowDetailModal(true);
  };

  const handleOpenDelete = (mat) => {
    setDeleteTarget(mat);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/raw-materials/${deleteTarget._id}`);
      toast.success(`Raw material "${deleteTarget.name}" deleted successfully`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete raw material');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export dataset
  const exportData = materials.map((m) => ({
    'SKU': m.sku,
    'Raw Material Name': m.name,
    'Category': m.category,
    'Unit': m.unit,
    'Starting Stock': m.startingInventory || 0,
    'Purchased Qty': m.purchasedQuantity || 0,
    'Production Output': m.productionOutput || 0,
    'Current Stock': m.currentInventory || 0,
    'Reorder Threshold': m.reorderPoint || 0,
    'Uses Aluminium': m.usesAluminium ? 'Yes' : 'No',
    'Alu Req / Unit': m.usesAluminium ? `${m.aluminiumRequiredPerUnit} ${m.aluminiumUnit}` : 'N/A',
    'Reorder Status': m.reorderStatus
  }));

  const exportHeaders = ['SKU', 'Raw Material Name', 'Category', 'Unit', 'Starting Stock', 'Purchased Qty', 'Production Output', 'Current Stock', 'Reorder Threshold', 'Uses Aluminium', 'Alu Req / Unit', 'Reorder Status'];

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Raw Materials & Components</h4>
          <p className="text-secondary small mb-0">
            Components used in luminaire assemblies with live transaction-backed stock
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ExportButtons
            data={exportData}
            headers={exportHeaders}
            title="Raw Materials Master Inventory"
            filename="raw_materials_inventory"
          />
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <i className="fas fa-plus"></i>
            <span>Add Raw Material</span>
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
                placeholder="Search name, SKU, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={reorderFilter}
              onChange={(e) => {
                setReorderFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Stock Statuses</option>
              <option value="Available">Available (OK)</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm"
              value={usesAluminium}
              onChange={(e) => {
                setUsesAluminium(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Materials</option>
              <option value="true">Uses Aluminium (Yes)</option>
              <option value="false">Standard (No Alu)</option>
            </select>
          </div>

          <div className="col-12 col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm flex-fill">
              Filter
            </button>
            {(search || category || reorderFilter || usesAluminium) && (
              <button type="button" onClick={handleClearFilters} className="btn btn-outline-secondary btn-sm">
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Raw Materials Table */}
      <div className="card card-custom p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Calculating material stock balances from purchases, production, and warehouse ledgers..." />
        ) : materials.length === 0 ? (
          <EmptyState
            title="No Raw Materials Found"
            description="No materials match your current filters."
            actionBtn={
              <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
                <i className="fas fa-plus me-1"></i> Add Material
              </button>
            }
          />
        ) : (
          <div className="table-responsive-custom border-0">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Raw Material Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="text-center">Current Stock</th>
                  <th className="text-center">Reorder Pt</th>
                  <th>Uses Alu</th>
                  <th>Alu Requirement</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <div className="fw-semibold text-dark">{m.name}</div>
                      {m.supplier && <div className="small text-muted">Supplier: {m.supplier}</div>}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace">{m.sku}</span>
                    </td>
                    <td>{m.category}</td>
                    <td className="text-center">
                      <span className="fw-bold fs-6 text-dark">{m.currentInventory || 0}</span>
                      <span className="small text-muted ms-1">{m.unit}</span>
                    </td>
                    <td className="text-center text-muted">
                      {m.reorderPoint}
                    </td>
                    <td>
                      {m.usesAluminium ? (
                        <span className="badge bg-warning-subtle text-dark border border-warning-subtle">
                          <i className="fas fa-check fa-xs me-1 text-warning"></i> Yes
                        </span>
                      ) : (
                        <span className="badge bg-light text-secondary border">No</span>
                      )}
                    </td>
                    <td>
                      {m.usesAluminium ? (
                        <span className="small fw-semibold text-dark">
                          {m.aluminiumRequiredPerUnit} {m.aluminiumUnit}
                        </span>
                      ) : (
                        <span className="text-muted small">-</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={m.reorderStatus} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleOpenDetails(m._id)}
                          title="View Inventory Breakdown & History"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Raw Material"
                        >
                          <i className="fas fa-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleOpenDelete(m)}
                          title="Delete Raw Material"
                        >
                          <i className="fas fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="p-3 border-top">
            <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
          </div>
        )}
      </div>

      {/* Modals */}
      <RawMaterialModal
        show={showAddEditModal}
        material={selectedMaterial}
        onClose={() => setShowAddEditModal(false)}
        onSuccess={fetchMaterials}
      />

      <RawMaterialDetailModal
        show={showDetailModal}
        materialId={detailMaterialId}
        onClose={() => setShowDetailModal(false)}
      />

      <ConfirmModal
        show={showDeleteModal}
        title="Delete Raw Material"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action is irreversible and will be blocked if this material is referenced by any Bill of Materials or production history.`}
        confirmText="Delete Material"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default RawMaterialList;
