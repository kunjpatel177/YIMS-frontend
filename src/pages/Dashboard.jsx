import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating factory inventory and manufacturing capacities..." />;
  }

  const { cards, charts, recentOrders, recentAluActivity, lowStockMaterialsList, capacityHighlights } = data || {};

  // Theme-aware Chart styling
  const textColor = isDark ? '#cbd5e1' : '#475569';
  const textMutedColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)';

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textMutedColor }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textMutedColor }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor }
      }
    }
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: textColor }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textMutedColor }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textMutedColor }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor }
      }
    }
  };

  // Chart 1: Monthly Sales vs Purchases
  const salesPurchasesChartData = {
    labels: charts?.months || [],
    datasets: [
      {
        label: 'Sale Orders',
        data: charts?.monthlySales || [],
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        borderRadius: 4
      },
      {
        label: 'Purchase Orders',
        data: charts?.monthlyPurchases || [],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 4
      }
    ]
  };

  // Chart 2: Warehouse Stock Distribution (Doughnut)
  const warehouseChartData = {
    labels: charts?.warehouseDistribution?.map((w) => `${w.code} (${w.name})`) || [],
    datasets: [
      {
        data: charts?.warehouseDistribution?.map((w) => w.stock) || [],
        backgroundColor: ['#2563eb', '#0ea5e9', '#6366f1'],
        borderWidth: 2,
        borderColor: isDark ? '#131f37' : '#ffffff'
      }
    ]
  };

  // Chart 3: Aluminium Stock Trend
  const aluTrendLabels = charts?.aluStockTrend?.map((t) => t.date) || [];
  const aluTrendBalances = charts?.aluStockTrend?.map((t) => t.balanceKg) || [];

  const aluTrendChartData = {
    labels: aluTrendLabels.length > 0 ? aluTrendLabels : ['Day 1', 'Day 2', 'Day 3', 'Today'],
    datasets: [
      {
        fill: true,
        label: 'Available Aluminium (kg)',
        data: aluTrendBalances.length > 0 ? aluTrendBalances : [50, 50, 50, Number(cards?.aluminium?.availableKg || 50)],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        tension: 0.3
      }
    ]
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Manufacturing & Inventory Dashboard</h4>
          <p className="text-secondary small mb-0">
            Real-time LED lighting production, multi-warehouse stock balances, and bottleneck analytics
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button onClick={fetchDashboard} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="fas fa-rotate-right"></i>
            <span>Refresh Data</span>
          </button>
          <Link to="/orders" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <i className="fas fa-plus"></i>
            <span>New Order</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Total Finished Products"
            value={cards?.totalProducts}
            unit="items"
            icon="fa-boxes-stacked"
            color="primary"
            subtitle={`${cards?.productsReadyToManufacture} ready to produce`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Raw Materials"
            value={cards?.totalRawMaterials}
            unit="components"
            icon="fa-cubes"
            color="info"
            subtitle={`${cards?.lowStockMaterials + cards?.outOfStockMaterials} reorder required`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Available Aluminium"
            value={cards?.aluminium?.availableKg}
            unit="kg"
            icon="fa-layer-group"
            color="warning"
            subtitle={`${cards?.aluminium?.availableGm} gm in stock`}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard
            title="Warehouse Transfers"
            value={cards?.totalWarehouseTransfers}
            unit="transfers"
            icon="fa-dolly"
            color="success"
            subtitle={`${cards?.pendingTransfers} pending approval`}
          />
        </div>
      </div>

      {/* Secondary KPI Row: Orders & Production Activity */}
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="card card-custom p-3">
            <div className="text-secondary small fw-semibold">Sale Orders</div>
            <div className="fs-4 fw-bold text-dark mt-1">{cards?.saleOrdersTotal}</div>
            <div className="text-muted small">{cards?.todaySales} created today</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-custom p-3">
            <div className="text-secondary small fw-semibold">Purchase Orders</div>
            <div className="fs-4 fw-bold text-dark mt-1">{cards?.purchaseOrdersTotal}</div>
            <div className="text-muted small">{cards?.todayPurchases} created today</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-custom p-3">
            <div className="text-secondary small fw-semibold">Aluminium Purchased</div>
            <div className="fs-4 fw-bold text-dark mt-1">{cards?.aluminium?.purchasedKg} <span className="fs-6 fw-normal">kg</span></div>
            <div className="text-muted small">{cards?.aluminium?.purchasedGm} gm converted</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-custom p-3">
            <div className="text-secondary small fw-semibold">Aluminium Used / Scrap</div>
            <div className="fs-4 fw-bold text-dark mt-1">{cards?.aluminium?.usedKg} <span className="fs-6 fw-normal">kg</span></div>
            <div className="text-danger small">{cards?.aluminium?.wastageGm} gm scrap/wastage</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3">
        {/* Monthly Orders Bar Chart */}
        <div className="col-12 col-lg-8">
          <div className="card card-custom p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">Monthly Orders Performance</h6>
                <div className="text-muted small">Sales vs Raw Material Purchases (Past 6 Months)</div>
              </div>
              <span className="badge bg-primary-subtle text-primary">Orders Activity</span>
            </div>
            <div style={{ height: '260px' }}>
              <Bar
                data={salesPurchasesChartData}
                options={barChartOptions}
              />
            </div>
          </div>
        </div>

        {/* Warehouse Inventory Distribution */}
        <div className="col-12 col-lg-4">
          <div className="card card-custom p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">Warehouse Stock Distribution</h6>
                <div className="text-muted small">Inventory units per facility</div>
              </div>
              <div
                className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
              >
                <i className="fas fa-warehouse"></i>
              </div>
            </div>
            <div style={{ height: '220px' }}>
              <Doughnut
                data={warehouseChartData}
                options={doughnutChartOptions}
              />
            </div>
            <div className="mt-3 pt-2 border-top small d-flex flex-wrap justify-content-between gap-2">
              {cards?.warehouses?.map((wh, idx) => {
                const dotColors = ['#2563eb', '#10b981', '#f59e0b', '#0ea5e9'];
                return (
                  <div key={wh.warehouseId || idx} className="d-flex align-items-center gap-1">
                    <span
                      className="rounded-circle d-inline-block"
                      style={{ width: '8px', height: '8px', backgroundColor: dotColors[idx % dotColors.length] }}
                    ></span>
                    <span className="text-secondary small fw-medium">{wh.code}: {wh.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Stock Matrix & Aluminium Trend */}
      <div className="row g-3">
        {/* Warehouse Balances Cards */}
        <div className="col-12 col-lg-6">
          <div className="card card-custom p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">Facility Stock Levels</h6>
                <div className="text-muted small">Live inventory across manufacturing locations</div>
              </div>
              <Link to="/warehouse-inventory" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                View All <i className="fas fa-arrow-right fa-xs ms-1"></i>
              </Link>
            </div>

            {/* Modern Warehouse Cards Stack */}
            <div className="d-flex flex-column gap-2">
              {cards?.warehouses?.map((wh, idx) => {
                const totalWh = (wh.productStock || 0) + (wh.rawMaterialStock || 0);
                const prodPct = totalWh > 0 ? Math.round(((wh.productStock || 0) / totalWh) * 100) : 0;
                const rawPct = totalWh > 0 ? 100 - prodPct : 0;

                const palettes = [
                  { bg: 'bg-primary-subtle', text: 'text-primary', icon: 'fa-industry' },
                  { bg: 'bg-info-subtle', text: 'text-info', icon: 'fa-warehouse' },
                  { bg: 'bg-success-subtle', text: 'text-success', icon: 'fa-dolly-flatbed' }
                ];
                const pal = palettes[idx % palettes.length];

                return (
                  <Link
                    key={wh.warehouseId || idx}
                    to="/warehouse-inventory"
                    className="warehouse-card p-2 text-decoration-none text-reset"
                    style={{ borderLeft: '4px solid var(--brand-primary)' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className={`warehouse-card-icon ${pal.bg} ${pal.text} rounded-2`}
                          style={{ width: '34px', height: '34px', fontSize: '1rem' }}
                        >
                          <i className={`fas ${pal.icon}`}></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>
                            {wh.name}
                          </div>
                          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.68rem' }}>
                            {wh.code}
                          </span>
                        </div>
                      </div>

                      <div className="text-end">
                        <div className="fw-bold text-primary font-monospace" style={{ fontSize: '1rem' }}>
                          {totalWh.toLocaleString()}
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Total Units</div>
                      </div>
                    </div>

                    {/* Ratio Bar */}
                    <div className="warehouse-progress-track mb-2" style={{ height: '4px' }}>
                      <div className="bg-primary" style={{ width: `${prodPct}%` }} title={`Products: ${prodPct}%`}></div>
                      <div className="bg-info" style={{ width: `${rawPct}%` }} title={`Raw Mat: ${rawPct}%`}></div>
                    </div>

                    {/* Quick breakdown tags */}
                    <div className="d-flex justify-content-between align-items-center text-secondary small" style={{ fontSize: '0.75rem' }}>
                      <span>
                        <i className="fas fa-box text-primary me-1"></i>
                        Finished: <strong className="text-dark">{wh.productStock?.toLocaleString()}</strong>
                      </span>
                      <span>
                        <i className="fas fa-cubes text-info me-1"></i>
                        Raw Mat: <strong className="text-dark">{wh.rawMaterialStock?.toLocaleString()}</strong>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aluminium Available Stock Trend */}
        <div className="col-12 col-lg-6">
          <div className="card card-custom p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="fw-bold text-dark mb-0">Aluminium Balance & Consumption</h6>
                <div className="text-muted small">Tracking available core material</div>
              </div>
              <Link to="/aluminium" className="btn btn-outline-warning btn-sm">
                Aluminium Hub
              </Link>
            </div>
            <div style={{ height: '220px' }}>
              <Line
                data={aluTrendChartData}
                options={lineChartOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Orders & Reorder Alerts */}
      <div className="row g-3">
        {/* Recent Orders */}
        <div className="col-12 col-lg-7">
          <div className="card card-custom p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0">Recent Order Activity</h6>
              <Link to="/orders" className="btn btn-link btn-sm p-0 text-decoration-none">
                All Orders <i className="fas fa-arrow-right fa-xs ms-1"></i>
              </Link>
            </div>
            <div className="table-responsive-custom">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Warehouse</th>
                    <th>Items</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders && recentOrders.length > 0 ? (
                    recentOrders.map((ord) => (
                      <tr key={ord._id}>
                        <td className="fw-semibold text-primary">{ord.orderNumber}</td>
                        <td>
                          <span
                            className={`badge ${
                              ord.orderType === 'PURCHASE' ? 'bg-info-subtle text-info-emphasis' : 'bg-primary-subtle text-primary'
                            }`}
                          >
                            {ord.orderType}
                          </span>
                        </td>
                        <td>{new Date(ord.orderDate).toLocaleDateString()}</td>
                        <td>{ord.warehouse?.name || 'W1'}</td>
                        <td>{ord.items?.length || 0} line(s)</td>
                        <td>
                          <StatusBadge status={ord.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-3">
                        No orders recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Materials Alert */}
        <div className="col-12 col-lg-5">
          <div className="card card-custom p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0">Low Stock & Reorder Alerts</h6>
              <Link to="/raw-materials" className="btn btn-link btn-sm p-0 text-decoration-none">
                Materials <i className="fas fa-arrow-right fa-xs ms-1"></i>
              </Link>
            </div>
            <div className="table-responsive-custom">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Available</th>
                    <th>Reorder Pt</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockMaterialsList && lowStockMaterialsList.length > 0 ? (
                    lowStockMaterialsList.map((m) => (
                      <tr key={m.id}>
                        <td className="fw-medium text-truncate" style={{ maxWidth: '150px' }} title={m.name}>
                          {m.name}
                        </td>
                        <td className="fw-bold text-danger">{m.currentStock}</td>
                        <td>{m.reorderPoint}</td>
                        <td>
                          <StatusBadge status={m.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-success py-3">
                        <i className="fas fa-check-circle me-1"></i> All raw materials above reorder point
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
