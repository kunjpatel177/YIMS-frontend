import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import GlobalSearchModal from '../common/GlobalSearchModal';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Global keyboard shortcut: Ctrl+K or Cmd+K to toggle search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Smooth outside click and Escape listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && userDropdownOpen) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <>
      <header className="top-navbar d-flex justify-content-between align-items-center">
        {/* Left Side: Hamburger & Global Search */}
        <div className="d-flex align-items-center gap-3">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="navbar-action-btn d-lg-none"
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Quick Global Search Bar Trigger */}
          <div
            className="navbar-search-trigger d-none d-md-flex align-items-center justify-content-between"
            style={{ width: '320px' }}
            onClick={() => setShowSearch(true)}
            role="button"
            tabIndex={0}
            title="Press Ctrl+K to search all records"
          >
            <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
              <i className="fas fa-search text-primary"></i>
              <span className="small text-truncate">Search records, SKU, orders...</span>
            </div>
            <kbd className="navbar-search-kbd ms-2">Ctrl K</kbd>
          </div>

          {/* Mobile Search Icon Button */}
          <button
            type="button"
            className="navbar-action-btn d-md-none"
            onClick={() => setShowSearch(true)}
            title="Global Search"
          >
            <i className="fas fa-search"></i>
          </button>

          {/* Live Date & Operations Status Badge */}
          <div
            className="d-none d-xl-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-light border text-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            <i className="far fa-calendar-alt text-primary"></i>
            <span>{todayFormatted}</span>
            {/* <span className="text-muted">&bull;</span> */}
            <span className="d-flex align-items-center gap-1 text-success fw-medium">
              <span className="pulse-beacon" style={{ width: '6px', height: '6px', marginRight: '3px' }}></span>
              3 Plants Live
            </span>
          </div>
        </div>

        {/* Right Side: Quick Action, Theme Switch, and User Profile */}
        <div className="d-flex align-items-center gap-2">
          {/* Quick Action: New Order */}
          <Link
            to="/orders"
            className="btn btn-sm btn-outline-primary rounded-pill px-3 py-2 d-none d-sm-flex align-items-center gap-2 fw-medium"
            style={{ fontSize: '0.8rem' }}
            title="Go to Orders Hub"
          >
            <i className="fas fa-plus fa-xs"></i>
            <span>New Order</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="navbar-action-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-primary'}`}></i>
          </button>

          {/* User Profile Pill & Smooth Dropdown */}
          <div className="position-relative" ref={dropdownRef}>
            <button
              className={`navbar-user-btn ${userDropdownOpen ? 'active' : ''}`}
              type="button"
              id="userDropdown"
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              aria-expanded={userDropdownOpen}
            >
              <div className="navbar-user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="d-none d-md-flex flex-column text-start lh-sm">
                <span className="fw-semibold text-truncate" style={{ fontSize: '0.82rem', maxWidth: '120px' }}>
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                  {user?.role || 'Super Admin'}
                </span>
              </div>
              <i
                className="fas fa-chevron-down text-muted fa-xs ms-1 d-none d-sm-inline-block"
                style={{
                  transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              ></i>
            </button>

            {/* Polished Smooth Dropdown Menu */}
            <ul
              className={`dropdown-menu dropdown-menu-end shadow-lg mt-2 ${userDropdownOpen ? 'show' : ''}`}
              aria-labelledby="userDropdown"
            >
              <li className="px-3 py-2 border-bottom">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <div className="navbar-user-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="fw-bold small text-dark text-truncate">{user?.name || 'Administrator'}</div>
                    <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>
                      {user?.email || 'admin@yims.com'}
                    </div>
                  </div>
                </div>
                <div className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.68rem' }}>
                  <i className="fas fa-shield-alt me-1"></i> {user?.role || 'Super Admin'} &bull; Online
                </div>
              </li>

              <li className="pt-1">
                <Link className="dropdown-item" to="/settings" onClick={() => setUserDropdownOpen(false)}>
                  <i className="fas fa-sliders-h text-primary"></i>
                  <span>System Settings</span>
                </Link>
              </li>

              <li>
                <Link className="dropdown-item" to="/warehouse-inventory" onClick={() => setUserDropdownOpen(false)}>
                  <i className="fas fa-warehouse text-info"></i>
                  <span>Warehouse Balances</span>
                </Link>
              </li>

              <li>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    toggleTheme();
                    setUserDropdownOpen(false);
                  }}
                >
                  <i className={`fas ${theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon text-secondary'}`}></i>
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </li>

              <li>
                <hr className="dropdown-divider" />
              </li>

              <li className="pb-1">
                <button
                  type="button"
                  className="dropdown-item text-danger"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal show={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Navbar;
