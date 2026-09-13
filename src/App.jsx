import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Products/ProductList';
import RawMaterialList from './pages/RawMaterials/RawMaterialList';
import BOMList from './pages/BOM/BOMList';
import OrdersHub from './pages/Orders/OrdersHub';
import AluminiumHub from './pages/Aluminium/AluminiumHub';
import WarehouseInventory from './pages/Warehouse/WarehouseInventory';
import TransferList from './pages/WarehouseTransfers/TransferList';
import ReportsHub from './pages/Reports/ReportsHub';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound';

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
