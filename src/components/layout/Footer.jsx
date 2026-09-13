import React from 'react';

const Footer = () => {
  return (
    <footer className="py-3 px-4 border-top text-center text-muted small bg-surface">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
        <div>
          <strong>Yashvee Inventory Management System (YIMS)</strong> &copy; {new Date().getFullYear()} LED Lighting Manufacturing
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="badge bg-success-subtle text-success border border-success-subtle">Production Ready</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
