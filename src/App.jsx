import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy-loaded Pages for fast initial bundle load
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProductList = lazy(() => import('./pages/Products/ProductList'));
const RawMaterialList = lazy(() => import('./pages/RawMaterials/RawMaterialList'));
const BOMList = lazy(() => import('./pages/BOM/BOMList'));
const OrdersHub = lazy(() => import('./pages/Orders/OrdersHub'));
const AluminiumHub = lazy(() => import('./pages/Aluminium/AluminiumHub'));
const WarehouseInventory = lazy(() => import('./pages/Warehouse/WarehouseInventory'));
const TransferList = lazy(() => import('./pages/WarehouseTransfers/TransferList'));
const ReportsHub = lazy(() => import('./pages/Reports/ReportsHub'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <LoadingSpinner message="Authenticating session..." />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <>
      <Suspense
        fallback={
          <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <LoadingSpinner message="Loading application..." />
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="raw-materials" element={<RawMaterialList />} />
          <Route path="bom" element={<BOMList />} />
          <Route path="orders" element={<OrdersHub />} />
          <Route path="aluminium" element={<AluminiumHub />} />
          <Route path="warehouse-inventory" element={<WarehouseInventory />} />
          <Route path="warehouse-transfers" element={<TransferList />} />
          <Route path="reports" element={<ReportsHub />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>

      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
