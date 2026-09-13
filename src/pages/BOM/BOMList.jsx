import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BOMModal from './BOMModal';
import DuplicateBOMModal from './DuplicateBOMModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import ExportButtons from '../../components/common/ExportButtons';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-toastify';

const BOMList = () => {
  const [activeTab, setActiveTab] = useState('explorer'); // 'explorer' | 'availability'
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productBOMData, setProductBOMData] = useState(null);
  const [capacitySummary, setCapacitySummary] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering for Tab 2 (Today's Availability Matrix)
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixPage, setMatrixPage] = useState(1);
  const [matrixPageSize, setMatrixPageSize] = useState(15);

  // Pagination for Tab 1 (Component Explorer)
  const [explorerPage, setExplorerPage] = useState(1);
  const [explorerPageSize] = useState(10);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedBOMItem, setSelectedBOMItem] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load products list for dropdown
  const loadProducts = async () => {
    try {
      const res = await api.get('/products?limit=300&sortBy=name&sortOrder=asc');
      setProducts(res.data.data);
      if (res.data.data.length > 0 && !selectedProductId) {
        setSelectedProductId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching products', err);
    }
  };

  // Load specific product's BOM and capacity analysis
  const fetchProductBOM = async (prodId) => {
    if (!prodId) return;
    try {
      setLoading(true);
      const res = await api.get(`/bom/product/${prodId}`);
      setProductBOMData(res.data.data);
    } catch (err) {
      console.error('Error loading product BOM', err);
    } finally {
      setLoading(false);
    }
  };

  // Load global "Today's Availability" capacity summary
  const fetchCapacitySummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bom/capacity-summary');
      setCapacitySummary(res.data.data);
    } catch (err) {
      console.error('Error loading capacity summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'explorer' && selectedProductId) {
      fetchProductBOM(selectedProductId);
    } else if (activeTab === 'availability') {
      fetchCapacitySummary();
    }
  }, [activeTab, selectedProductId]);

  // Reset explorer page when selected product changes
  useEffect(() => {
    setExplorerPage(1);
  }, [selectedProductId]);

  // Reset matrix page when search or page size changes
  useEffect(() => {
    setMatrixPage(1);
  }, [matrixSearch, matrixPageSize]);

  const handleOpenAdd = () => {
    setSelectedBOMItem(null);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedBOMItem(item);
    setShowAddEditModal(true);
  };

  const handleOpenDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/bom/${deleteTarget._id}`);
      toast.success('BOM component removed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchProductBOM(selectedProductId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting BOM component');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Tab 1 (Explorer) pagination calculations
  const allMaterials = productBOMData?.capacityAnalysis?.materials || [];
  const explorerTotal = allMaterials.length;
  const explorerPages = Math.ceil(explorerTotal / explorerPageSize) || 1;
  const paginatedMaterials = allMaterials.slice(
    (explorerPage - 1) * explorerPageSize,
    explorerPage * explorerPageSize
  );

  // Tab 2 (Availability Matrix) filtering & pagination calculations
  const filteredCapacitySummary = capacitySummary.filter((item) => {
    if (!matrixSearch) return true;
    const s = matrixSearch.toLowerCase();
    return (
      item.productName?.toLowerCase().includes(s) ||
      item.sku?.toLowerCase().includes(s) ||
      item.category?.toLowerCase().includes(s)
    );
  });
  const matrixTotal = filteredCapacitySummary.length;
  const matrixPages = Math.ceil(matrixTotal / matrixPageSize) || 1;
  const paginatedCapacity = filteredCapacitySummary.slice(
    (matrixPage - 1) * matrixPageSize,
    matrixPage * matrixPageSize
  );

  // Export Data for Explorer
  const explorerExportData = allMaterials.map((m) => ({
    'Product': productBOMData?.product?.name,
    'Component Name': m.rawMaterialName,
    'SKU': m.sku,
    'Required Qty': m.requiredPerUnit,
    'Unit': m.unit,
    'Available RM Stock': m.availableStock,
    'Can Make Units': m.canMakeUnits,
    'Is Bottleneck': productBOMData?.capacityAnalysis?.bottleneckMaterial?.id === m.rawMaterialId ? 'YES (Bottleneck)' : 'No'
  }));

  // Export Data for Today's Availability
  const availabilityExportData = filteredCapacitySummary.map((c) => ({
    'Product Name': c.productName,
    'SKU': c.sku,
    'Category': c.category,
    'Finished Goods Stock': c.finishedStock,
    'Manufacturing Capacity': c.manufacturingCapacity,
    'Total Supply Potential': c.finishedStock + c.manufacturingCapacity,
    'Bottleneck Component': c.bottleneckMaterial ? c.bottleneckMaterial.name : 'N/A',
    'Has Active BOM': c.hasBOM ? 'Yes' : 'No'
  }));

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Bill of Materials (BOM) & Today's Availability</h4>
          <p className="text-secondary small mb-0">
            Product recipes, component bottleneck formulas, and production capacity calculations
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {activeTab === 'explorer' ? (
            <ExportButtons
              data={explorerExportData}
              title={`BOM Capacity - ${productBOMData?.product?.name || 'Product'}`}
              filename="product_bom_analysis"
            />
          ) : (
            <ExportButtons
              data={availabilityExportData}
              title="Today's Product Manufacturing Availability"
              filename="todays_product_availability"
            />
          )}

          {activeTab === 'explorer' && (
            <>
              <button
                onClick={() => setShowDuplicateModal(true)}
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                title="Clone BOM recipe to another product"
              >
                <i className="fas fa-copy"></i>
                <span>Duplicate BOM</span>
              </button>
              <button onClick={handleOpenAdd} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
                <i className="fas fa-plus"></i>
                <span>Add Component</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills border-bottom pb-2">
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            <i className="fas fa-diagram-project me-1"></i> Product BOM & Capacity Bottlenecks
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link btn-sm ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            <i className="fas fa-boxes-packing me-1"></i> Today's Availability Matrix (All Products)
          </button>
        </li>
      </ul>

      {activeTab === 'explorer' ? (
        <div className="d-flex flex-column gap-3">
          {/* Product Selector Card */}
          <div className="card card-custom p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <label className="form-label small fw-semibold text-secondary mb-1">Select Product to Inspect BOM</label>
                <select
                  className="form-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) - {p.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Bottleneck Formula Card */}
              {productBOMData && (
                <div className="col-12 col-md-7">
                  <div className="p-3 bg-light rounded-3 border d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <div className="text-secondary small fw-semibold">"How Many Can Be Made?" (Bottleneck)</div>
                      <div className="fs-3 fw-bold text-success">
                        {productBOMData.capacityAnalysis?.capacity || 0}{' '}
                        <span className="fs-6 fw-normal text-muted">units</span>
                      </div>
                    </div>

                    {productBOMData.capacityAnalysis?.bottleneckMaterial ? (
                      <div className="text-end">
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                          <i className="fas fa-triangle-exclamation me-1"></i> Bottleneck Component
                        </span>
                        <div className="fw-semibold text-dark mt-1">
                          {productBOMData.capacityAnalysis.bottleneckMaterial.name}
                        </div>
                        <div className="small text-muted">
                          Available: {productBOMData.capacityAnalysis.bottleneckMaterial.availableStock} / Limit:{' '}
                          {productBOMData.capacityAnalysis.bottleneckMaterial.canMake} units
                        </div>
                      </div>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary">No raw material limits</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Component BOM Table */}
          <div className="card card-custom p-0 overflow-hidden">
            {loading ? (
              <LoadingSpinner message="Calculating bottleneck capacity across raw materials..." />
            ) : !productBOMData?.bomEntries || productBOMData.bomEntries.length === 0 ? (
              <EmptyState
                icon="fa-diagram-project"
                title="No BOM Components Configured"
                description={`Product "${productBOMData?.product?.name}" currently has no recipe components.`}
                actionBtn={
                  <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
                    <i className="fas fa-plus me-1"></i> Add First Component
                  </button>
                }
              />
            ) : (
              <div className="table-responsive-custom border-0">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th>Raw Material Component</th>
                      <th>SKU</th>
                      <th className="text-center">Req / Unit</th>
                      <th className="text-center">Available In Stock</th>
                      <th className="text-center">Can Produce</th>
                      <th>Uses Aluminium</th>
                      <th>Bottleneck</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMaterials.map((m) => {
                      const isBottleneck =
                        productBOMData.capacityAnalysis?.bottleneckMaterial?.id === m.rawMaterialId;
                      const bomEntry = productBOMData.bomEntries.find(
                        (b) => b.rawMaterial?._id === m.rawMaterialId
                      );

                      return (
                        <tr key={m.rawMaterialId} className={isBottleneck ? 'table-warning' : ''}>
                          <td>
                            <div className="fw-semibold text-dark">{m.rawMaterialName}</div>
                            {bomEntry?.notes && <div className="small text-muted">{bomEntry.notes}</div>}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace">{m.sku}</span>
                          </td>
                          <td className="text-center fw-bold">
                            {m.requiredPerUnit} <span className="small text-muted">{m.unit}</span>
                          </td>
                          <td className="text-center fw-semibold">
                            {m.availableStock.toLocaleString()}
                          </td>
                          <td className="text-center">
                            <span className={`badge ${isBottleneck ? 'bg-danger' : 'bg-success-subtle text-success'} px-2 py-1`}>
                              {m.canMakeUnits.toLocaleString()} units
                            </span>
                          </td>
                          <td>
                            {bomEntry?.rawMaterial?.usesAluminium ? (
                              <span className="badge bg-warning-subtle text-dark border border-warning-subtle">
                                {bomEntry.rawMaterial.aluminiumRequiredPerUnit} {bomEntry.rawMaterial.aluminiumUnit}
                              </span>
                            ) : (
                              <span className="text-muted small">No</span>
                            )}
                          </td>
                          <td>
                            {isBottleneck ? (
                              <span className="badge bg-danger text-white">
                                <i className="fas fa-circle-exclamation me-1"></i> Bottleneck
                              </span>
                            ) : (
                              <span className="text-muted small">OK</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              {bomEntry && (
                                <>
                                  <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => handleOpenEdit(bomEntry)}
                                    title="Edit Quantity"
                                  >
                                    <i className="fas fa-pencil"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleOpenDelete(bomEntry)}
                                    title="Remove from BOM"
                                  >
                                    <i className="fas fa-trash-can"></i>
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

            {explorerTotal > explorerPageSize && (
              <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2 bg-light-subtle">
                <div className="small text-secondary">
                  Showing {(explorerPage - 1) * explorerPageSize + 1} &ndash;{' '}
                  {Math.min(explorerPage * explorerPageSize, explorerTotal)} of {explorerTotal} components
                </div>
                <Pagination
                  pagination={{
                    page: explorerPage,
                    pages: explorerPages,
                    total: explorerTotal,
                    limit: explorerPageSize
                  }}
                  onPageChange={(p) => setExplorerPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Today's Availability Matrix (All Products) */
        <div className="d-flex flex-column gap-3">
          {/* Search & Filter Bar */}
          <div className="card card-custom p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="fas fa-search text-secondary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-sm border-start-0"
                    placeholder="Search products by name, SKU, category..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                  />
                  {matrixSearch && (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setMatrixSearch('')}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-6 text-md-end">
                <span className="badge bg-secondary">
                  {matrixTotal} of {capacitySummary.length} Products
                </span>
              </div>
            </div>
          </div>

          <div className="card card-custom p-0 overflow-hidden">
            {loading ? (
              <LoadingSpinner message="Evaluating manufacturing capacity and available stock across all products..." />
            ) : filteredCapacitySummary.length === 0 ? (
              <EmptyState
                title="No Products Found"
                description={matrixSearch ? `No products match "${matrixSearch}"` : 'No active products available.'}
              />
            ) : (
              <>
                <div className="table-responsive-custom border-0">
                  <table className="table table-custom mb-0">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th className="text-center">Finished Stock</th>
                        <th className="text-center">Can Be Made (BOM)</th>
                        <th className="text-center">Total Supply Potential</th>
                        <th>Limiting / Bottleneck Material</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCapacity.map((item) => (
                        <tr key={item.productId}>
                          <td className="fw-semibold text-dark">{item.productName}</td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace">{item.sku}</span>
                          </td>
                          <td>{item.category}</td>
                          <td className="text-center fw-semibold text-primary">
                            {item.finishedStock.toLocaleString()}
                          </td>
                          <td className="text-center">
                            {item.hasBOM ? (
                              <span
                                className={`badge ${
                                  item.manufacturingCapacity > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                                } fw-bold px-2 py-1`}
                              >
                                +{item.manufacturingCapacity.toLocaleString()}
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted border">No BOM</span>
                            )}
                          </td>
                          <td className="text-center fw-bold fs-6 text-dark">
                            {(item.finishedStock + item.manufacturingCapacity).toLocaleString()}
                          </td>
                          <td>
                            {item.bottleneckMaterial ? (
                              <div>
                                <span className="badge bg-warning-subtle text-dark border border-warning-subtle">
                                  {item.bottleneckMaterial.name}
                                </span>
                                <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                                  Limits capacity to {item.bottleneckMaterial.canMake} units
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => {
                                setSelectedProductId(item.productId);
                                setActiveTab('explorer');
                              }}
                            >
                              Inspect BOM
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {matrixTotal > 0 && (
                  <div className="p-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2 bg-light-subtle">
                    <div className="d-flex align-items-center gap-2 small text-secondary">
                      <span>Rows per page:</span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={matrixPageSize}
                        onChange={(e) => {
                          setMatrixPageSize(Number(e.target.value));
                          setMatrixPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="ms-2">
                        Showing {Math.min((matrixPage - 1) * matrixPageSize + 1, matrixTotal)} &ndash;{' '}
                        {Math.min(matrixPage * matrixPageSize, matrixTotal)} of {matrixTotal} products
                      </span>
                    </div>
                    <Pagination
                      pagination={{
                        page: matrixPage,
                        pages: matrixPages,
                        total: matrixTotal,
                        limit: matrixPageSize
                      }}
                      onPageChange={(p) => setMatrixPage(p)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <BOMModal
        show={showAddEditModal}
        bomItem={selectedBOMItem}
        defaultProductId={selectedProductId}
        onClose={() => setShowAddEditModal(false)}
        onSuccess={() => fetchProductBOM(selectedProductId)}
      />

      <DuplicateBOMModal
        show={showDuplicateModal}
        sourceProductId={selectedProductId}
        onClose={() => setShowDuplicateModal(false)}
        onSuccess={() => fetchProductBOM(selectedProductId)}
      />

      <ConfirmModal
        show={showDeleteModal}
        title="Remove Component from BOM"
        message={`Are you sure you want to remove "${deleteTarget?.rawMaterial?.name}" from this product's Bill of Materials?`}
        confirmText="Remove Component"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default BOMList;
