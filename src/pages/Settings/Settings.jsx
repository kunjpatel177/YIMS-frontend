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
    <div className="d-flex flex-column gap-3" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div>
        <h4 className="fw-bold mb-1 text-dark">System Configuration & Settings</h4>
        <p className="text-secondary small mb-0">
          Manage business profile, units of measure, reorder thresholds, and admin security
        </p>
      </div>

      {/* Company Profile Card */}
      <div className="card card-custom p-4">
        <h5 className="fw-bold text-dark mb-3">
          <i className="fas fa-building text-primary me-2"></i> Business & Plant Details
        </h5>

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
            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              {savingSettings && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin Security Card */}
      <div className="card card-custom p-4">
        <h5 className="fw-bold text-dark mb-1">
          <i className="fas fa-lock text-warning me-2"></i> Admin Security & Password
        </h5>
        <p className="text-secondary small mb-3">
          Logged in as: <strong>{user?.name}</strong> ({user?.email})
        </p>

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
            <button type="submit" className="btn btn-outline-danger" disabled={savingPassword}>
              {savingPassword && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
