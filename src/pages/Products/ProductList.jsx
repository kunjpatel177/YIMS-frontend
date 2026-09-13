import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProductModal from './ProductModal';
import ProductDetailModal from './ProductDetailModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import ExportButtons from '../../components/common/ExportButtons';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailProductId, setDetailProductId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search,
        category,
        status
      };
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
      setCategories(res.data.categories || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setPage(1);
  };

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setShowAddEditModal(true);
  };

  const handleOpenDetails = (prodId) => {
    setDetailProductId(prodId);
    setShowDetailModal(true);
  };

  const handleOpenDelete = (prod) => {
    setDeleteTarget(prod);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/products/${deleteTarget._id}`);
      toast.success(`Product "${deleteTarget.name}" deleted successfully`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Prepare data for CSV/Excel/PDF export
  const exportData = products.map((p) => ({
    'SKU': p.sku,
    'Product Name': p.name,
    'Category': p.category,
    'Unit': p.unit,
    'Total Stock': p.totalStock || 0,
    'Dynamic Sales Qty': p.salesQuantity || 0,
    'Manufacturing Capacity': p.manufacturingCapacity || 0,
    'Bottleneck Material': p.bottleneckMaterial?.name || 'N/A',
    'Status': p.status
  }));

  const exportHeaders = ['SKU', 'Product Name', 'Category', 'Unit', 'Total Stock', 'Dynamic Sales Qty', 'Manufacturing Capacity', 'Bottleneck Material', 'Status'];

  // Quick metric counters
  const totalCount = pagination?.total || products.length;
  const readyToMakeCount = products.filter((p) => (p.manufacturingCapacity || 0) > 0).length;
  const configuredBomCount = products.filter((p) => p.hasBOM).length;
  const activeCount = products.filter((p) => p.status === 'Active').length;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="page-header-icon bg-primary text-white shadow-sm">
            <i className="fas fa-boxes-stacked"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="page-header-title mb-0">Finished Products & Components</h4>
              <span className="page-context-pill">Catalog</span>
            </div>
            <p className="page-header-subtitle mb-0">
              Catalog of LED luminaires, floodlights, and manufacturing component items
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <ExportButtons
            data={exportData}
            headers={exportHeaders}
            title="Products Master Catalog"
            filename="products_catalog"
          />
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm px-3">
            <i className="fas fa-plus"></i>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Ribbon */}
      <div className="page-stats-ribbon">
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-primary-subtle text-primary">
            <i className="fas fa-box-open"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{totalCount}</div>
            <div className="stat-ribbon-lbl">Total Catalog Items</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-success-subtle text-success">
            <i className="fas fa-industry"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{readyToMakeCount}</div>
            <div className="stat-ribbon-lbl">Ready to Produce</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-info-subtle text-info">
            <i className="fas fa-diagram-project"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{configuredBomCount}</div>
            <div className="stat-ribbon-lbl">Configured BOMs</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-indigo-subtle text-indigo">
            <i className="fas fa-circle-check"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{activeCount}</div>
            <div className="stat-ribbon-lbl">Active Products</div>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card card-custom p-3">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light text-secondary">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
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
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-12 col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm flex-fill">
              Filter
            </button>
            {(search || category || status) && (
              <button type="button" onClick={handleClearFilters} className="btn btn-outline-secondary btn-sm">
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="card card-custom p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading products and computing sales & stock metrics..." />
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="No product records match your filter criteria."
            actionBtn={
              <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
                <i className="fas fa-plus me-1"></i> Add First Product
              </button>
            }
          />
        ) : (
          <div className="table-responsive-custom border-0">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th className="text-center">Sales Qty (Auto)</th>
                  <th className="text-center">Total Stock</th>
                  <th className="text-center">Can Be Made</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="table-item-avatar bg-primary-subtle text-primary shrink-0">
                          <i className="fas fa-box"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{p.name}</div>
                          {p.description && <div className="small text-muted text-truncate" style={{ maxWidth: '240px' }}>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-custom bg-light text-dark border font-monospace px-2 py-1">{p.sku}</span>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary px-2 py-1">{p.category}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1">
                        {p.salesQuantity || 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="fw-bold text-dark">{p.totalStock || 0}</span>
                      <span className="small text-muted ms-1">{p.unit}</span>
                    </td>
                    <td className="text-center">
                      {p.hasBOM ? (
                        <span
                          className={`badge ${
                            p.manufacturingCapacity > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                          } fw-bold px-2 py-1`}
                          title={p.bottleneckMaterial ? `Bottleneck: ${p.bottleneckMaterial.name}` : ''}
                        >
                          {p.manufacturingCapacity} units
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border">No BOM</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          className="table-action-btn"
                          onClick={() => handleOpenDetails(p._id)}
                          title="View Details & BOM"
                        >
                          <i className="fas fa-eye text-primary"></i>
                        </button>
                        <button
                          className="table-action-btn"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                        >
                          <i className="fas fa-pencil text-secondary"></i>
                        </button>
                        <button
                          className="table-action-btn text-danger"
                          onClick={() => handleOpenDelete(p)}
                          title="Delete Product"
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
      <ProductModal
        show={showAddEditModal}
        product={selectedProduct}
        onClose={() => setShowAddEditModal(false)}
        onSuccess={fetchProducts}
      />

      <ProductDetailModal
        show={showDetailModal}
        productId={detailProductId}
        onClose={() => setShowDetailModal(false)}
      />

      <ConfirmModal
        show={showDeleteModal}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will be blocked if referenced in Bill of Materials or Orders.`}
        confirmText="Delete Product"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ProductList;
