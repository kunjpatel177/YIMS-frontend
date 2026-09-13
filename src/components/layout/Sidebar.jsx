import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: '/', icon: 'fa-gauge-high' }
      ]
    },
    {
      title: 'Manufacturing & Core',
      items: [
        { name: 'Products Catalog', path: '/products', icon: 'fa-boxes-stacked' },
        { name: 'Raw Materials', path: '/raw-materials', icon: 'fa-cubes' },
        { name: 'Bill of Materials', path: '/bom', icon: 'fa-diagram-project' },
        { name: 'Aluminium Mgmt', path: '/aluminium', icon: 'fa-layer-group' }
      ]
    },
    {
      title: 'Logistics & Warehouses',
      items: [
        { name: 'Orders Hub', path: '/orders', icon: 'fa-cart-flatbed' },
        { name: 'Warehouse Balances', path: '/warehouse-inventory', icon: 'fa-warehouse' },
        { name: 'Stock Transfers', path: '/warehouse-transfers', icon: 'fa-dolly' }
      ]
    },
    {
      title: 'Intelligence & Control',
      items: [
        { name: 'Reports & Audits', path: '/reports', icon: 'fa-chart-pie' },
        { name: 'System Settings', path: '/settings', icon: 'fa-gear' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="modal-backdrop fade show d-lg-none"
          style={{ zIndex: 1035 }}
          onClick={onClose}
        ></div>
      )}

      <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div className="d-flex align-items-center gap-3">
            <div className="sidebar-brand-icon">
              <i className="fas fa-bolt-lightning"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold fs-6 text-white lh-1">YIMS</span>
                <span className="sidebar-badge-version">PRO</span>
              </div>
              <div className="text-secondary small text-truncate mt-1" style={{ fontSize: '0.7rem' }}>
                LED Manufacturing ERP
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link text-secondary d-lg-none p-0"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Navigation Groups List */}
        <div className="py-2 flex-grow-1">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="mb-2">
              <div className="sidebar-section-title">
                <span>{section.title}</span>
              </div>
              <nav className="nav flex-column">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="sidebar-icon-box">
                      <i className={`fas ${item.icon}`}></i>
                    </span>
                    <span>{item.name}</span>
                    <i className="fas fa-chevron-right sidebar-arrow-indicator"></i>
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}

          {/* Operational Status Live Beacon Card */}
          <div className="sidebar-status-card">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="d-flex align-items-center gap-2">
                <span className="pulse-beacon"></span>
                <span className="text-white fw-semibold" style={{ fontSize: '0.75rem' }}>
                  System Active
                </span>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace" style={{ fontSize: '0.62rem' }}>
                3 PLANTS
              </span>
            </div>
            <div className="text-secondary small" style={{ fontSize: '0.7rem' }}>
              W1 &bull; W2 &bull; W3 Multi-Location Sync
            </div>
          </div>
        </div>

        {/* Sidebar Footer / User Profile & Logout */}
        <div className="sidebar-footer p-3">
          {/* User Profile Summary */}
          <div className="d-flex align-items-center gap-2 mb-2 p-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div className="sidebar-user-avatar" style={{ width: '36px', height: '36px' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden flex-grow-1">
              <div className="fw-semibold text-white text-truncate" style={{ fontSize: '0.84rem' }}>
                {user?.name || 'Administrator'}
              </div>
              <div className="text-secondary small text-truncate" style={{ fontSize: '0.7rem' }}>
                {user?.role || 'Super Admin'} &bull; <span className="text-success fw-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Large, Easy-to-Click Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Sign out of YIMS"
          >
            <i className="fas fa-arrow-right-from-bracket"></i>
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
