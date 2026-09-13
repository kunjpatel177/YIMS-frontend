import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const GlobalSearchModal = ({ show, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PRODUCTS' | 'RAW_MATERIALS' | 'ORDERS' | 'ALUMINIUM'
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (show) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults(null);
      setActiveTab('ALL');
    }
  }, [show]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data.data);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!show) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const totalResultsCount =
    (results?.products?.length || 0) +
    (results?.rawMaterials?.length || 0) +
    (results?.orders?.length || 0) +
    (results?.aluminium?.length || 0);

  const quickPicks = [
    { label: 'Products Catalog', path: '/products', icon: 'fa-box', color: 'text-primary' },
    { label: 'Raw Materials', path: '/raw-materials', icon: 'fa-cubes', color: 'text-info' },
    { label: 'Sales & Purchases', path: '/orders', icon: 'fa-shopping-cart', color: 'text-success' },
    { label: 'Aluminium Register', path: '/aluminium', icon: 'fa-layer-group', color: 'text-warning' },
    { label: 'Warehouse Balances', path: '/warehouse-inventory', icon: 'fa-warehouse', color: 'text-primary' }
  ];

  return (
    <div
      className="modal fade show d-block global-search-backdrop"
      tabIndex="-1"
      style={{ zIndex: 1070 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content global-search-card shadow-lg border-0">
          {/* Top Search Input Bar */}
          <div className="p-3 border-bottom d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center text-primary"
              style={{ width: '28px', height: '28px', fontSize: '1.2rem' }}
            >
              <i className="fas fa-search"></i>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="form-control global-search-input-box p-0 flex-grow-1"
              placeholder="Type to search SKU, products, raw materials, orders, aluminium..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && (
              <div className="spinner-border spinner-border-sm text-primary me-1" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
            {query && !loading && (
              <button
                type="button"
                className="btn btn-sm btn-link text-secondary p-0 text-decoration-none"
                onClick={() => setQuery('')}
                title="Clear search"
              >
                <i className="fas fa-times-circle fs-5"></i>
              </button>
            )}
            <kbd
              className="navbar-search-kbd d-none d-sm-inline-block cursor-pointer"
              onClick={onClose}
              title="Close search"
            >
              ESC
            </kbd>
          </div>

          {/* Category Filter Chips Bar (Shown when search has results) */}
          {results && totalResultsCount > 0 && (
            <div className="px-3 py-2 border-bottom d-flex align-items-center gap-2 overflow-auto" style={{ whiteSpace: 'nowrap' }}>
              <button
                type="button"
                className={`search-category-pill ${activeTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveTab('ALL')}
              >
                All Results ({totalResultsCount})
              </button>
              {results.products?.length > 0 && (
                <button
                  type="button"
                  className={`search-category-pill ${activeTab === 'PRODUCTS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('PRODUCTS')}
                >
                  <i className="fas fa-box me-1"></i> Products ({results.products.length})
                </button>
              )}
              {results.rawMaterials?.length > 0 && (
                <button
                  type="button"
                  className={`search-category-pill ${activeTab === 'RAW_MATERIALS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('RAW_MATERIALS')}
                >
                  <i className="fas fa-cubes me-1"></i> Raw Materials ({results.rawMaterials.length})
                </button>
              )}
              {results.orders?.length > 0 && (
                <button
                  type="button"
                  className={`search-category-pill ${activeTab === 'ORDERS' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ORDERS')}
                >
                  <i className="fas fa-shopping-cart me-1"></i> Orders ({results.orders.length})
                </button>
              )}
              {results.aluminium?.length > 0 && (
                <button
                  type="button"
                  className={`search-category-pill ${activeTab === 'ALUMINIUM' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ALUMINIUM')}
                >
                  <i className="fas fa-layer-group me-1"></i> Aluminium ({results.aluminium.length})
                </button>
              )}
            </div>
          )}

          {/* Search Content Body */}
          <div className="modal-body p-3" style={{ minHeight: '320px', maxHeight: '520px', overflowY: 'auto' }}>
            {/* 1. Initial State: Quick Jump Suggestions */}
            {!loading && !results && query.length < 2 && (
              <div className="py-2">
                <div className="text-muted small fw-semibold text-uppercase mb-3 px-1">
                  <i className="fas fa-bolt text-warning me-1"></i> Quick Navigation
                </div>
                <div className="d-flex flex-column gap-1">
                  {quickPicks.map((pick, i) => (
                    <button
                      key={i}
                      type="button"
                      className="global-search-item"
                      onClick={() => handleNavigate(pick.path)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center bg-light border"
                          style={{ width: '36px', height: '36px' }}
                        >
                          <i className={`fas ${pick.icon} ${pick.color}`}></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{pick.label}</div>
                          <div className="text-secondary small">Jump directly to {pick.label.toLowerCase()} hub</div>
                        </div>
                      </div>
                      <i className="fas fa-chevron-right text-muted small"></i>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-top text-center text-muted small">
                  <i className="fas fa-info-circle me-1"></i> Type at least 2 characters to search across products, raw materials, orders, and aluminium logs.
                </div>
              </div>
            )}

            {/* 2. Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-grow text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="fw-semibold text-dark">Searching YIMS Database</div>
                <div className="text-secondary small mt-1">Scanning inventory records, SKUs, and transaction histories...</div>
              </div>
            )}

            {/* 3. Empty Search Results */}
            {!loading && query.length >= 2 && results && totalResultsCount === 0 && (
              <div className="text-center py-5">
                <div
                  className="mx-auto rounded-circle d-flex align-items-center justify-content-center bg-light border mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <i className="fas fa-search-minus text-secondary fs-4"></i>
                </div>
                <h6 className="fw-bold text-dark">No records found</h6>
                <p className="text-secondary small mb-0">
                  No products, raw materials, orders, or aluminium items matched <span className="fw-semibold text-primary">"{query}"</span>
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                    onClick={() => setQuery('')}
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}

            {/* 4. Categorized Results List */}
            {!loading && results && totalResultsCount > 0 && (
              <div className="d-flex flex-column gap-3">
                {/* Products Section */}
                {(activeTab === 'ALL' || activeTab === 'PRODUCTS') && results.products?.length > 0 && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span className="text-uppercase text-secondary small fw-bold">
                        <i className="fas fa-box text-primary me-2"></i> Finished Products ({results.products.length})
                      </span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none small"
                        onClick={() => handleNavigate('/products')}
                      >
                        Open Products Hub
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {results.products.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          className="global-search-item"
                          onClick={() => handleNavigate('/products')}
                        >
                          <div className="d-flex align-items-center gap-3 overflow-hidden">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0"
                              style={{ width: '36px', height: '36px' }}
                            >
                              <i className="fas fa-lightbulb"></i>
                            </div>
                            <div className="text-truncate">
                              <div className="fw-semibold text-dark text-truncate">{p.name}</div>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="badge bg-light text-primary border font-monospace" style={{ fontSize: '0.72rem' }}>
                                  {p.sku}
                                </span>
                                {p.category && (
                                  <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.72rem' }}>
                                    {p.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                            {p.totalStock !== undefined && (
                              <span className="badge bg-light text-dark border">
                                Stock: {p.totalStock?.toLocaleString()}
                              </span>
                            )}
                            <i className="fas fa-arrow-right text-muted small"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Materials Section */}
                {(activeTab === 'ALL' || activeTab === 'RAW_MATERIALS') && results.rawMaterials?.length > 0 && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span className="text-uppercase text-secondary small fw-bold">
                        <i className="fas fa-cubes text-info me-2"></i> Raw Materials ({results.rawMaterials.length})
                      </span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none small text-info"
                        onClick={() => handleNavigate('/raw-materials')}
                      >
                        Open Materials Hub
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {results.rawMaterials.map((m) => (
                        <button
                          key={m._id}
                          type="button"
                          className="global-search-item"
                          onClick={() => handleNavigate('/raw-materials')}
                        >
                          <div className="d-flex align-items-center gap-3 overflow-hidden">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center bg-info-subtle text-info border border-info-subtle flex-shrink-0"
                              style={{ width: '36px', height: '36px' }}
                            >
                              <i className="fas fa-layer-group"></i>
                            </div>
                            <div className="text-truncate">
                              <div className="fw-semibold text-dark text-truncate">{m.name}</div>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.72rem' }}>
                                  {m.sku}
                                </span>
                                {m.usesAluminium && (
                                  <span className="badge bg-warning-subtle text-warning border border-warning" style={{ fontSize: '0.7rem' }}>
                                    Uses Aluminium
                                  </span>
                                )}
                                {m.category && (
                                  <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.72rem' }}>
                                    {m.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                            {m.totalStock !== undefined && (
                              <span className="badge bg-light text-dark border">
                                Stock: {m.totalStock?.toLocaleString()} {m.unit || 'pcs'}
                              </span>
                            )}
                            <i className="fas fa-arrow-right text-muted small"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders Section */}
                {(activeTab === 'ALL' || activeTab === 'ORDERS') && results.orders?.length > 0 && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span className="text-uppercase text-secondary small fw-bold">
                        <i className="fas fa-shopping-cart text-success me-2"></i> Orders ({results.orders.length})
                      </span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none small text-success"
                        onClick={() => handleNavigate('/orders')}
                      >
                        Open Orders Hub
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {results.orders.map((o) => (
                        <button
                          key={o._id}
                          type="button"
                          className="global-search-item"
                          onClick={() => handleNavigate('/orders')}
                        >
                          <div className="d-flex align-items-center gap-3 overflow-hidden">
                            <div
                              className={`rounded-3 d-flex align-items-center justify-content-center border flex-shrink-0 ${
                                o.orderType === 'PURCHASE'
                                  ? 'bg-info-subtle text-info border-info-subtle'
                                  : 'bg-success-subtle text-success border-success-subtle'
                              }`}
                              style={{ width: '36px', height: '36px' }}
                            >
                              <i className={o.orderType === 'PURCHASE' ? 'fas fa-truck-loading' : 'fas fa-receipt'}></i>
                            </div>
                            <div className="text-truncate">
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-semibold text-dark">{o.orderNumber}</span>
                                <span className={`badge ${o.orderType === 'PURCHASE' ? 'bg-info' : 'bg-success'}`} style={{ fontSize: '0.68rem' }}>
                                  {o.orderType}
                                </span>
                              </div>
                              <div className="text-secondary small text-truncate mt-1">
                                {o.partyName || (o.warehouse ? `Warehouse: ${o.warehouse.name}` : 'Internal Order')}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                            <span className="badge bg-secondary-subtle text-secondary border">
                              {o.status}
                            </span>
                            <i className="fas fa-arrow-right text-muted small"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aluminium Section */}
                {(activeTab === 'ALL' || activeTab === 'ALUMINIUM') && results.aluminium?.length > 0 && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span className="text-uppercase text-secondary small fw-bold">
                        <i className="fas fa-layer-group text-warning me-2"></i> Aluminium Transactions ({results.aluminium.length})
                      </span>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none small text-warning"
                        onClick={() => handleNavigate('/aluminium')}
                      >
                        Open Aluminium Hub
                      </button>
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {results.aluminium.map((a) => (
                        <button
                          key={a._id}
                          type="button"
                          className="global-search-item"
                          onClick={() => handleNavigate('/aluminium')}
                        >
                          <div className="d-flex align-items-center gap-3 overflow-hidden">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center bg-warning-subtle text-dark border border-warning-subtle flex-shrink-0"
                              style={{ width: '36px', height: '36px' }}
                            >
                              <i className="fas fa-coins text-warning"></i>
                            </div>
                            <div className="text-truncate">
                              <div className="fw-semibold text-dark">{a.purchaseNumber || a.productionNumber}</div>
                              <div className="text-secondary small mt-1">
                                {a.type} &bull; {new Date(a.purchaseDate || a.productionDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                            <span className="badge bg-light text-dark border font-monospace">
                              {a.totalWeightKg ? `${a.totalWeightKg} kg` : `${a.totalGrams || 0} gm`}
                            </span>
                            <i className="fas fa-arrow-right text-muted small"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer / Shortcuts Help */}
          <div className="modal-footer bg-light px-3 py-2 d-flex justify-content-between align-items-center border-top">
            <div className="d-flex align-items-center gap-3 small text-muted">
              <span>
                <kbd className="navbar-search-kbd me-1">ESC</kbd> to close
              </span>
              <span>
                <kbd className="navbar-search-kbd me-1">↵</kbd> to select
              </span>
            </div>
            <div className="small text-muted font-monospace">
              <i className="fas fa-database text-primary me-1"></i> YIMS Global Search
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
