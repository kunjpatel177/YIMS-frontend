import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [companySettings, setCompanySettings] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    defaultCurrency: 'INR (₹)',
    defaultWeightUnit: 'gm',
    defaultReorderPoint: 200,
    theme: 'light'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.data.data) {
          setCompanySettings(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveCompanySettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.put('/settings', companySettings);
      setTheme(companySettings.theme);
      toast.success('Company settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSavingPassword(true);
      await updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Admin password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading configuration preferences..." />;
  }

  return (
    <div className="d-flex flex-column gap-3" style={{ maxWidth: 'fit-content' }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3">
        <div className="page-header-icon bg-primary text-white shadow-sm">
          <i className="fas fa-sliders"></i>
        </div>
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="page-header-title mb-0">System Configuration & Settings</h4>
            <span className="page-context-pill">Control Center</span>
          </div>
          <p className="page-header-subtitle mb-0">
            Manage business identity, units of measure, production defaults, and admin credentials
          </p>
        </div>
      </div>

      {/* Quick Stats Ribbon */}
      <div className="setting-stats-ribbon flex flex-row justify-between px-4 py-3 rounded-xl">
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-primary-subtle text-primary">
            <i className="fas fa-building"></i>
          </div>
          <div>
            <div className="stat-ribbon-val text-truncate" style={{ maxWidth: '180px' }}>
              {companySettings.companyName || 'Yashvee Enterprise'}
            </div>
            <div className="stat-ribbon-lbl">Operating Entity</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-warning-subtle text-warning">
            <i className="fas fa-scale-balanced"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{companySettings.defaultWeightUnit?.toUpperCase() || 'GM'}</div>
            <div className="stat-ribbon-lbl">Aluminium Base Unit</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-success-subtle text-success">
            <i className="fas fa-indian-rupee-sign"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">{companySettings.defaultCurrency || 'INR (₹)'}</div>
            <div className="stat-ribbon-lbl">Base Currency</div>
          </div>
        </div>
        <div className="stat-ribbon-divider"></div>
        <div className="stat-ribbon-item">
          <div className="stat-ribbon-icon bg-info-subtle text-info">
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <div className="stat-ribbon-val">Super Admin</div>
            <div className="stat-ribbon-lbl">Access Privileges</div>
          </div>
        </div>
      </div>

      {/* Company Profile Card */}
      <div className="card card-custom p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="table-item-avatar bg-primary-subtle text-primary flex-shrink-0" style={{ width: '42px', height: '42px' }}>
              <i className="fas fa-building fa-lg"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">Business & Plant Details</h5>
              <div className="small text-secondary">General operational metadata, currency notation, and unit systems</div>
            </div>
          </div>
          <span className="badge bg-light text-secondary border font-monospace">Plant Configuration</span>
        </div>

        <form onSubmit={handleSaveCompanySettings}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Company / Entity Name</label>
              <input
                type="text"
                className="form-control"
                value={companySettings.companyName}
                onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Official Contact Email</label>
              <input
                type="email"
                className="form-control"
                value={companySettings.companyEmail}
                onChange={(e) => setCompanySettings({ ...companySettings, companyEmail: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Phone / Operations Line</label>
              <input
                type="text"
                className="form-control"
                value={companySettings.companyPhone}
                onChange={(e) => setCompanySettings({ ...companySettings, companyPhone: e.target.value })}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Currency Notation</label>
              <input
                type="text"
                className="form-control"
                value={companySettings.defaultCurrency}
                onChange={(e) => setCompanySettings({ ...companySettings, defaultCurrency: e.target.value })}
              />
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold text-secondary">Plant / Factory Physical Address</label>
              <textarea
                className="form-control"
                rows="2"
                value={companySettings.companyAddress}
                onChange={(e) => setCompanySettings({ ...companySettings, companyAddress: e.target.value })}
              ></textarea>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Base Aluminium Unit</label>
              <select
                className="form-select"
                value={companySettings.defaultWeightUnit}
                onChange={(e) => setCompanySettings({ ...companySettings, defaultWeightUnit: e.target.value })}
              >
                <option value="gm">Grams (gm) - Internal Base Unit</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold text-secondary">Dashboard Theme</label>
              <select
                className="form-select"
                value={companySettings.theme}
                onChange={(e) => setCompanySettings({ ...companySettings, theme: e.target.value })}
              >
                <option value="light">Light Mode (Clean White)</option>
                <option value="dark">Dark Mode (Night Shift)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 pt-3 border-top d-flex justify-content-end">
            <button type="submit" className="btn btn-primary px-4 shadow-sm d-flex align-items-center gap-2" disabled={savingSettings}>
              {savingSettings ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-floppy-disk"></i>
                  <span>Save System Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Security Card */}
      <div className="card card-custom p-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="table-item-avatar bg-danger-subtle text-danger flex-shrink-0" style={{ width: '42px', height: '42px' }}>
              <i className="fas fa-shield-halved fa-lg"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">Admin Security & Password</h5>
              <div className="small text-secondary">
                Logged in as: <strong>{user?.name}</strong> ({user?.email})
              </div>
            </div>
          </div>
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
            <i className="fas fa-lock me-1"></i> Root Protected
          </span>
        </div>

        <form onSubmit={handlePasswordChange}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Current Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Min 6 characters"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top d-flex justify-content-end">
            <button type="submit" className="btn btn-outline-danger px-4 d-flex align-items-center gap-2" disabled={savingPassword}>
              {savingPassword ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-key"></i>
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
