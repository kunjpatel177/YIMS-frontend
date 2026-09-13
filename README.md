# YIMS Frontend (React.js Client Application)

The frontend for the **Yashvee Inventory Management System (YIMS)** is an enterprise-grade Single Page Application (SPA) built with React 18, Vite 5, Bootstrap 5, and Font Awesome 6. It provides an intuitive, high-performance user interface for managing LED lighting manufacturing operations, multi-facility warehouse stock, Bill of Materials (BOM) bottlenecks, and aluminium production workflows.

---

## 🎨 User Interface & Design Features

1. **Light & Dark Theme Engine**:
   - System-wide dark mode with custom color tokens (`--bg-body`, `--bg-surface`, `--text-primary`, `--border-color`).
   - Chart.js charts dynamically react to theme switches, updating grid lines, ticks, and legend colors.
   - Theme preference is stored in `localStorage('yims_theme')` and applied via `data-theme` attribute on the `<html>` element.

2. **Global Command Palette (`Ctrl+K` / `Cmd+K`)**:
   - Global keyboard shortcut accessible from any page.
   - Search across Products, Raw Materials, Orders, Aluminium Records, and Warehouse Balances.
   - Category filter tabs with result counts and keyboard navigation (`ESC` to close, `↵` to select).

3. **Enterprise Navigation**:
   - Categorized collapsible sidebar with operational plant beacon (`● System Active`), PRO version badge, and enlarged logout button.
   - Glassmorphic top navigation bar with frosted backdrop blur, live date and plant status badge, quick-action `+ New Order` trigger, and smooth user dropdown menus.

4. **Multi-Item Scrollable Modals**:
   - Pinned modal headers and action footers (`flex-shrink: 0`) ensure "Submit" and action buttons remain visible regardless of form length.
   - Smooth internal scrolling (`overflow-y: auto`) with custom slim scrollbars.
   - Live source warehouse stock validation and deficit warnings for multi-item stock transfers.

5. **Upgraded Detail Stat Cards (`.modal-stat-card`)**:
   - Interactive metric cards in Product and Raw Material detail modals.
   - Color-coded semantic top borders:
     - **Primary Blue (`#2563eb`)**: Sales activity and current live stock.
     - **Indigo (`#6366f1`)**: Total aggregate warehouse stock.
     - **Emerald (`#10b981`)**: Manufacturing capacity and production output.
     - **Cyan (`#0ea5e9`)**: Purchase orders stock receipts.
     - **Slate (`#64748b`)**: Legacy starting baseline.
   - Icon avatar badges with hover scaling, high-contrast metrics, and status badges.

6. **Comprehensive Pagination & Multi-Format Exports**:
   - Full pagination controls with configurable page sizes (10, 15, 25, 50, 100 rows per page) across all reports and tables.
   - One-click **CSV**, **Excel (.xlsx)** via SheetJS, and **PDF** via jsPDF + autoTable.

---

## 📁 Directory Structure

```
frontend/
├── index.html                  # HTML entry point with viewport and theme support
├── package.json                # Dependencies and npm scripts
├── vite.config.js              # Vite configuration & backend proxy (/api -> :5000)
├── src/
│   ├── main.jsx                # Application root mounting React DOM
│   ├── App.jsx                 # Route definitions & layout wrappers
│   ├── index.css               # Global stylesheet, design system & dark mode rules
│   ├── context/                # React Context Providers
│   │   ├── AuthContext.jsx     # Authentication state & JWT session management
│   │   └── ThemeContext.jsx    # Light/Dark mode state & localStorage persistence
│   ├── services/
│   │   └── api.js              # Axios instance with auth interceptor & base URL
│   ├── components/
│   │   ├── layout/             # Layout components
│   │   │   ├── Navbar.jsx      # Top glassmorphic bar with search, date & user pill
│   │   │   ├── Sidebar.jsx     # Categorized navigation with plant status beacon
│   │   │   └── Footer.jsx      # App footer with copyright and version info
│   │   └── common/             # Reusable UI components
│   │       ├── EmptyState.jsx  # Empty state illustration & action callout
│   │       ├── GlobalSearchModal.jsx # Command Palette (Ctrl+K) search
│   │       ├── LoadingSpinner.jsx # Smooth animated loading indicators
│   │       ├── MetricCard.jsx  # Dashboard KPI metric cards with icon boxes
│   │       ├── Pagination.jsx  # Multi-page navigation & page size selector
│   │       └── StatusBadge.jsx # Color-coded status pills (Active, Low, Pending, etc.)
│   └── pages/                  # Page views
│       ├── Dashboard.jsx       # Main manufacturing analytics & Chart.js widgets
│       ├── Login.jsx           # User authentication login screen
│       ├── Products/
│       │   ├── ProductList.jsx # Finished goods catalog table & action buttons
│       │   ├── ProductModal.jsx# Create/Edit product modal
│       │   └── ProductDetailModal.jsx # Product specs, stat cards, stock & BOM
│       ├── RawMaterials/
│       │   ├── RawMaterialList.jsx # Component inventory table & formula balances
│       │   ├── RawMaterialModal.jsx# Create/Edit raw material modal
│       │   └── RawMaterialDetailModal.jsx # Inventory formula tiles & BOM usage
│       ├── BOM/
│       │   ├── BOMList.jsx     # Component Explorer & Today's Availability Matrix
│       │   └── BOMModal.jsx    # Create/Edit BOM recipe component rows
│       ├── Aluminium/
│       │   └── AluminiumHub.jsx# Balances, purchases, production runs & ledger
│       ├── Orders/
│       │   ├── OrdersHub.jsx   # Sales & Purchases orders list & status filter
│       │   ├── OrderCreateModal.jsx # Multi-item mixed product/material order form
│       │   └── OrderDetailModal.jsx # Itemized order inspection & action buttons
│       ├── Warehouse/
│       │   └── WarehouseInventory.jsx # Facility hub cards & stock balances
│       ├── WarehouseTransfers/
│       │   ├── TransferList.jsx# Multi-item warehouse stock transfers
│       │   ├── TransferCreateModal.jsx # Transfer form with live source stock lookup
│       │   └── TransferDetailModal.jsx # Transfer rows inspection
│       ├── Reports/
│       │   └── ReportsHub.jsx  # 7-in-1 paginated reports hub with export tools
│       └── Settings/
│           └── Settings.jsx    # Enterprise system configuration & thresholds
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Backend API**: Running on port `5000` (see `backend/README.md`)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Development Mode
Run the Vite development server with hot module replacement (HMR):
```bash
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.
- All `/api/*` requests are automatically proxied to the backend at `http://127.0.0.1:5000` via `vite.config.js`.

### 3. Production Build
Build optimized production bundles:
```bash
npm run build
```
- Output is generated in `dist/`.
- The production build can be served directly by the backend Express server (`backend/src/server.js`) or any static web server.

### 4. Preview Production Build
Preview the generated production build locally:
```bash
npm run preview
```

---

## 🧭 Page Routes & Modules

| Route | Page Component | Description |
|---|---|---|
| `/` | `Dashboard.jsx` | Factory KPI metrics, Monthly Orders bar chart, Warehouse Distribution doughnut chart, Aluminium balance trend, and live facility stock |
| `/products` | `ProductList.jsx` | Finished LED fixtures, dynamic sales quantity from completed orders, total stock, and capacity indicators |
| `/raw-materials` | `RawMaterialList.jsx` | Component raw materials, dynamic inventory calculation, and reorder point threshold badges |
| `/bom` | `BOMList.jsx` | Bill of Materials management and Today's Availability Matrix (manufacturing capacity & bottleneck components) |
| `/aluminium` | `AluminiumHub.jsx` | Core aluminium inventory (kg/gm), supplier purchases, die-casting production runs, and immutable ledger |
| `/orders` | `OrdersHub.jsx` | Purchase Orders (incoming stock) and Sale Orders (consuming products and raw materials) with approval workflow |
| `/warehouse-inventory` | `WarehouseInventory.jsx` | Live stock breakdown across Warehouse 1 (Main), Warehouse 2 (Sub-Assembly), and Warehouse 3 (Finished Goods) |
| `/warehouse-transfers` | `TransferList.jsx` | Multi-item atomic stock transfers between warehouses with pre-transfer stock validation |
| `/reports` | `ReportsHub.jsx` | 7-in-1 consolidated reports (Sales, Purchases, Stock Balances, Low Stock, Capacity, Transfers, Aluminium Ledger) with pagination & exports |
| `/settings` | `Settings.jsx` | System-wide configuration (company name, reorder alert defaults, prefixes, currency) |
| `/login` | `Login.jsx` | Admin & staff authentication screen |

---

## 📦 Key Dependencies & Libraries

- **React 18** (`react`, `react-dom`): Concurrent rendering and state management.
- **React Router 6** (`react-router-dom`): Declarative client-side routing.
- **Vite 5** (`vite`, `@vitejs/plugin-react`): High-speed development server and Rollup bundler.
- **Bootstrap 5** (`bootstrap`): Responsive CSS grid and foundational UI utilities.
- **Font Awesome 6 Free** (`@fortawesome/fontawesome-free`): Scalable vector iconography.
- **Axios** (`axios`): Promise-based HTTP client configured with JWT interceptors.
- **Chart.js 4 & React-Chartjs-2** (`chart.js`, `react-chartjs-2`): Interactive canvas-based charts with light/dark theme adaptation.
- **SheetJS** (`xlsx`): Client-side spreadsheet generation (`.xlsx`).
- **jsPDF & AutoTable** (`jspdf`, `jspdf-autotable`): Client-side PDF generation for reports and order invoices.
- **React Toastify** (`react-toastify`): Toast alerts and notifications.

---

## 💡 Developer Tips

- **Theme Toggling**: Click the moon/sun icon in the top navbar or call `toggleTheme()` from `useTheme()` to switch between Light and Dark modes.
- **Global Search**: Press `Ctrl + K` (or `Cmd + K` on macOS) anywhere in the application to open the Command Palette search modal.
- **Backend API URL**: Configured in `src/services/api.js` with default `baseURL: '/api'`. In development, Vite's proxy forwards requests to `http://127.0.0.1:5000`.
