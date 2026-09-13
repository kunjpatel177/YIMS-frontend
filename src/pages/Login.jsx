import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('admin@yims.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await login(email, password, rememberMe);
      toast.success('Welcome back to YIMS!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@yims.com');
    setPassword('admin123');
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 p-3"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
      }}
    >
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '440px', width: '100%', overflow: 'hidden' }}>
        <div className="bg-primary p-4 text-center text-white position-relative">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-white text-primary rounded-circle mb-2 shadow-sm"
            style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}
          >
            <i className="fas fa-industry"></i>
          </div>
          <h4 className="fw-bold mb-1">YIMS</h4>
          <p className="mb-0 small text-white text-opacity-75">
            Yashvee Inventory Management System
          </p>
          <div className="badge bg-white bg-opacity-25 mt-2 px-3 py-1 font-monospace">
            LED Lighting Manufacturing
          </div>
        </div>

        <div className="card-body p-4 p-sm-5 bg-surface">
          <h5 className="fw-bold text-dark mb-1">Admin Sign In</h5>
          <p className="text-secondary small mb-4">Enter your credentials to access the management portal</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Admin Email</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-secondary border-end-0">
                  <i className="fas fa-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control border-start-0"
                  placeholder="admin@yims.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-secondary border-end-0">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control border-start-0"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label small text-secondary" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0"
                onClick={fillDemo}
              >
                Auto-fill demo
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
              disabled={loading}
            >
              {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
              <span>Sign In to Dashboard</span>
              <i className="fas fa-arrow-right fa-xs"></i>
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center">
            <span className="small text-muted">
              Secure single-user manufacturing administration
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
