# Food Manufacturing Production Management System (FoodManu PMS)

A production-grade, full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) web application engineered for industrial food processing plants and commercial bakeries. It unifies customer demand forecasting, dynamic bill of materials (BOM), automated raw material requirement calculations, real-time inventory tracking, batch-wise manufacturing progress telemetry, and intelligent threshold alerts.

---

## 📋 Table of Contents
1. [Problem Statement](#problem-statement)
2. [Objectives](#objectives)
3. [Key Features](#key-features)
4. [MERN Architecture & Workflow](#mern-architecture--workflow)
5. [Technology Stack](#technology-stack)
6. [Folder Structure](#folder-structure)
7. [Installation & Setup](#installation--setup)
8. [MongoDB Atlas Configuration](#mongodb-atlas-configuration)
9. [Environment Variables](#environment-variables)
10. [Database Seeding](#database-seeding)
11. [Running the Application](#running-the-application)
12. [API Documentation](#api-documentation)
13. [Test Credentials](#test-credentials)
14. [Testing & Verification](#testing--verification)
15. [Future Enhancements](#future-enhancements)

---

## 🎯 Problem Statement
Food manufacturing facilities face severe logistical inefficiencies due to disconnected systems between sales demand, recipe formulation (BOM), raw material procurement, and batch execution on factory floors. Errors in manual stock calculations frequently cause production downtime due to unexpected stockouts or costly ingredient spoilage. A consolidated digital platform is critical to automate requirement calculations, prevent stock depletion, and track production throughput in real time.

---

## 🎯 Objectives
- **Automate Material Requirement Planning (MRP)**: Calculate precise ingredient quantities per batch based on defined BOM ratios.
- **Synchronize Demand & Execution**: Dynamically calculate production quantities based on:
  $$\text{Production Quantity} = \max(0, \text{Demand Quantity} - \text{Available Finished Stock})$$
- **Prevent Stock Depletion**: Trigger automated `LOW_STOCK` alerts whenever ingredient quantities drop to or below configured reorder levels ($CurrentStock \le ReorderLevel$).
- **Ensure Non-Negative Stock Integrity**: Enforce strict validation rules preventing negative inventory and negative production runs.
- **Provide Real-Time Operational Intelligence**: Render interactive KPI dashboards and Recharts telemetry for plant managers.

---

## ✨ Features

### 1. Authentication & Role-Based Access Control
- Secure JWT authentication with bcryptjs password hashing.
- Role-based capabilities for **Admin**, **Production Manager**, and **Inventory Manager**.
- Persistent sessions with Axios request/response interceptors and protected routes.

### 2. Product Management
- Complete catalog of manufactured food products (e.g., Whole Wheat Bread, Butter Biscuits, Vanilla Sponge Cake).
- Attributes: Product ID, Name, Category, Description, Unit, Price, Production Time, and Active/Inactive Status.

### 3. Demand Management
- Track incoming customer purchase orders with delivery timelines.
- Priority levels: `Low`, `Medium`, `High`, `Urgent`.
- Status lifecycle: `Pending` → `Approved` → `In Production` → `Completed` (or `Cancelled`).

### 4. Production Planning
- Link orders to production batches.
- Business rule enforcement: prevents negative production plans and auto-computes net requirements.
- Statuses: `Planned`, `Scheduled`, `In Progress`, `Completed`, `Delayed`, `Cancelled`.

### 5. Raw Material Management
- Ingredient inventory tracking with minimum stock, maximum stock, reorder levels, unit costs, and suppliers.
- Real-time stock state indicator: `Available`, `Low Stock`, and `Out of Stock`.

### 6. Bill of Materials (BOM)
- Recipe formula mapping per unit of finished product.
- Live material calculation endpoint:
  $$\text{Required Quantity} = \text{QuantityPerUnit} \times \text{Production Quantity}$$
- Automated shortage detection comparing required amounts with current stock on hand.

### 7. Inventory Transactions
- Full transactional ledger recording `IN` (receipts), `OUT` (consumption), and `ADJUSTMENT` (stock audit).
- Validation blocks any withdrawal exceeding available stock.
- Instant trigger for automatic `LOW_STOCK` alerts upon balance update.

### 8. Manufacturing Progress Tracking
- Production batch telemetry tracking planned, completed, and rejected quantities.
- Progress calculation:
  $$\text{Progress \%} = \min\left(100, \text{round}\left(\frac{\text{Completed Quantity}}{\text{Planned Quantity}} \times 100\right)\right)$$
- Auto-completes linked production plan when batch reaches 100%.

### 9. Alert Management System
- Severity levels: `Low`, `Medium`, `High`, `Critical`.
- Automated detection for `LOW_STOCK`, `MATERIAL_SHORTAGE`, `PRODUCTION_DELAY`, `PENDING_DEMAND`, and `PRODUCTION_COMPLETED`.
- Interactive mark-as-read and dismiss controls.

### 10. Reports & Analytics
- Multi-dimensional reporting: Executive Summary, Production Throughput, Inventory Valuation, and Demand Fulfillment.

### 11. Command Center Dashboard
- 8 high-level KPI cards.
- 4 dynamic **Recharts**:
  1. *Demand vs Production* (Grouped Bar Chart)
  2. *Production Overview* (Status Distribution Bar Chart)
  3. *Inventory Status* (Donut Chart with Stock Health)
  4. *Production Progress* (Horizontal Completion Bar Chart)

---

## 🏗️ MERN Architecture & Workflow

```
[ Customer Demand ]
        ↓
[ Production Planning ] ── (Calculates: Demand Qty - Available Stock)
        ↓
[ Bill of Materials (BOM) ] ── (Calculates: QtyPerUnit × Production Qty)
        ↓
[ Raw Material Requirements ] ── (Detects Shortages)
        ↓
[ Inventory Management ] ── (IN / OUT / ADJUSTMENT transactions)
        ↓
[ Manufacturing Progress ] ── (Calculates Progress %, Max 100%)
        ↓
[ Threshold Alerts ] ── (Auto-generates LOW_STOCK alerts)
        ↓
[ Reports & Dashboard ] ── (Interactive Recharts & KPIs)
```

```
React (Vite Frontend)
        ↓  (Axios with JWT Bearer Interceptors)
Node.js + Express.js REST API
        ↓  (Mongoose ODM)
MongoDB Atlas (Cloud Database)
```

---

## 💻 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, JavaScript (ES6+), React Router DOM 7, Axios, Lucide React, Recharts, Vanilla CSS |
| **Backend** | Node.js, Express.js, Mongoose 8, JSON Web Token (jsonwebtoken), bcryptjs, cors, dotenv |
| **Database** | MongoDB Atlas Cloud Database (`food_manufacturing_db`) |
| **Security** | JWT authentication, bcryptjs salt rounds, CORS whitelisting, MongoDB query sanitization |

> ⚠️ **Strict Compliance Note**: This application uses **ONLY** the MERN stack. No Python, FastAPI, Flask, Django, MySQL, or SQLite are used.

---

## 📁 Folder Structure

```
food-manufacturing-production/
├── client/                          # React + Vite Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Modal, StatCard, StatusBadge, ProgressBar, ConfirmDialog, Sidebar, Header
│   │   │   └── ProtectedRoute.jsx   # Route guard checking JWT in localStorage
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication state and login/logout functions
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx       # App shell containing Sidebar, Header, and content outlet
│   │   ├── pages/
│   │   │   ├── Alerts.jsx           # System alerts and notifications
│   │   │   ├── BOM.jsx              # Recipe formulation & live MRP calculator
│   │   │   ├── Dashboard.jsx        # Command center with 8 KPIs & 4 Recharts
│   │   │   ├── Demand.jsx           # Customer order tracking
│   │   │   ├── Inventory.jsx        # Stock ledger (IN, OUT, ADJUSTMENT)
│   │   │   ├── Login.jsx            # Sign-in portal
│   │   │   ├── ManufacturingProgress.jsx # Batch production progress tracker
│   │   │   ├── ProductionPlanning.jsx    # Production planning & scheduling
│   │   │   ├── Products.jsx         # Finished food product catalog
│   │   │   ├── RawMaterials.jsx     # Ingredient inventory & threshold management
│   │   │   ├── RawMaterialsInventory.jsx # Combined raw materials & transactions view
│   │   │   └── Reports.jsx          # Executive, production, inventory & demand reports
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance with interceptors and named API helpers
│   │   │   ├── authService.js       # Auth API client
│   │   │   └── resource.js          # Generic CRUD resource factory
│   │   ├── utils/
│   │   │   └── formatters.js        # Date, currency, and number formatters
│   │   ├── App.jsx                  # React Router routes and page definitions
│   │   ├── index.css                # Global stylesheet & design tokens
│   │   └── main.jsx                 # Vite application entry point
│   ├── index.html                   # HTML5 template
│   ├── package.json                 # Frontend dependencies & scripts
│   └── vite.config.js               # Vite configuration
│
├── server/                          # Node.js + Express Backend
│   ├── config/
│   │   └── db.js                    # Mongoose MongoDB Atlas connection
│   ├── controllers/
│   │   ├── alertController.js       # Alert operations & read tracking
│   │   ├── authController.js        # Register, login, getMe
│   │   ├── bomController.js         # BOM CRUD & material requirement calculator
│   │   ├── dashboardController.js   # 8 Stats & 4 Chart aggregations
│   │   ├── demandController.js      # Customer demands CRUD
│   │   ├── inventoryController.js   # Stock transactions & negative stock protection
│   │   ├── productController.js     # Food products CRUD
│   │   ├── productionPlanController.js # Production planning & demand deduction
│   │   ├── progressController.js    # Manufacturing progress & percentage calculation
│   │   ├── rawMaterialController.js # Raw materials CRUD & status calculation
│   │   └── reportController.js      # Summary, production, inventory, demand reports
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification & role authorization
│   │   └── errorHandler.js          # Centralized error handler
│   ├── models/
│   │   ├── Alert.js                 # Alert Mongoose model
│   │   ├── BOM.js                   # Bill of Materials Mongoose model
│   │   ├── Demand.js                # Demand Mongoose model
│   │   ├── Inventory.js             # Inventory transaction Mongoose model
│   │   ├── ManufacturingProgress.js # Progress Mongoose model (capped at 100%)
│   │   ├── Product.js               # Product Mongoose model
│   │   ├── ProductionPlan.js        # Production Plan Mongoose model
│   │   ├── RawMaterial.js           # Raw Material Mongoose model
│   │   └── User.js                  # User Mongoose model with bcryptjs
│   ├── routes/                      # Express route definitions
│   ├── seed/
│   │   └── seed.js                  # Idempotent development database seeder
│   ├── utils/
│   │   ├── alertService.js          # Low-stock detection & alert creation
│   │   └── generateId.js            # Sequential ID generator (PROD-001, MAT-001, etc.)
│   ├── .env                         # Environment variables (git-ignored)
│   ├── .env.example                 # Template for environment variables
│   ├── package.json                 # Backend dependencies & scripts
│   └── server.js                    # Express application entry point
├── .gitignore                       # Repository-wide git-ignore
└── README.md                        # Project documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas** account or active connection URI

---

## 🗄️ MongoDB Atlas Configuration

1. Log into your [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Create a Cluster (Free M0 Sandbox or Dedicated).
3. Under **Database Access**, create a user with read/write privileges to `food_manufacturing_db`.
4. Under **Network Access**, add your current IP address (or `0.0.0.0/0` for development).
5. Obtain your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/food_manufacturing_db?retryWrites=true&w=majority
   ```

---

## 🔐 Environment Variables

Create `server/.env` with the following variables (refer to `server/.env.example`):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/food_manufacturing_db?appName=Cluster0
JWT_SECRET=your_jwt_super_secret_production_key_here
PORT=8001
CLIENT_URL=http://localhost:5173
```

> 🔒 **Security Notice**: `server/.env` is strictly listed in `.gitignore` and must never be committed to source control.

---

## 🌾 Database Seeding

To populate MongoDB Atlas with realistic industrial test data (products, ingredients, BOM relations, demands, plans, transactions, progress, and alerts):

```bash
cd server
npm run seed
```

This populates:
- **5 Food Products**: Whole Wheat Bread, Butter Biscuits, Vanilla Sponge Cake, Chocolate Cookies, Tomato Sauce.
- **8 Raw Materials**: Wheat Flour, Sugar, Butter, Eggs, Yeast, Cocoa Powder, Tomatoes, Salt.
- **18 BOM Formula Relations**
- Realistic customer demands, production schedules, inventory logs, and threshold alerts.

---

## 🚀 Running the Application

### Option A: Run Backend Server
In a terminal:
```bash
cd server
npm run dev
# Or for standard execution:
npm start
```
The backend API starts on **http://localhost:8001**
Health Check: **http://localhost:8001/api/health**

### Option B: Run Frontend Client
In a second terminal:
```bash
cd client
npm run dev
```
The frontend starts on **http://localhost:5173**

### Option C: Production Build
```bash
cd client
npm run build
```
Creates an optimized, minified production distribution in `client/dist`.

---

## 📡 API Documentation

### Public Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status and database connectivity |
| `POST` | `/api/auth/register` | Register new staff account |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT Bearer token |

### Authenticated Endpoints (Header: `Authorization: Bearer <token>`)

#### Dashboard & Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | 8 KPI statistics, recent activity feeds, and 4 Recharts datasets |
| `GET` | `/api/reports/summary` | Executive operations summary |
| `GET` | `/api/reports/production`| Production throughput and completion analytics |
| `GET` | `/api/reports/inventory` | Inventory asset valuation & stock state breakdown |
| `GET` | `/api/reports/demands` | Demand fulfillment by priority and status |

#### Products & BOM
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List all manufactured products (supports `?search=` and `?status=`) |
| `POST` | `/api/products` | Create a new food product |
| `PUT` | `/api/products/:id` | Update product details |
| `DELETE`| `/api/products/:id` | Remove product |
| `GET` | `/api/bom` | List all bill of materials recipes |
| `POST` | `/api/bom` | Define ingredient ratio per unit |
| `GET` | `/api/bom/product/:productId/requirements?quantity=N` | Compute dynamic raw material requirements for batch quantity N |

#### Demands & Production Planning
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/demands` | List customer demand orders |
| `POST` | `/api/demands` | Create customer order |
| `PUT` | `/api/demands/:id` | Update customer order status / due dates |
| `GET` | `/api/production-plans` | List scheduled production plans |
| `POST` | `/api/production-plans` | Create production run (auto-calculates from linked demand) |
| `PUT` | `/api/production-plans/:id` | Update production status |

#### Raw Materials & Inventory
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/raw-materials` | List raw materials with stock status |
| `POST` | `/api/raw-materials` | Add new raw material |
| `GET` | `/api/inventory` | Retrieve stock ledger log |
| `POST` | `/api/inventory` | Post `IN`, `OUT`, or `ADJUSTMENT` transaction |

#### Manufacturing Progress & Alerts
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/production-progress` | Retrieve manufacturing run progress |
| `POST` | `/api/production-progress` | Record batch progress |
| `PUT` | `/api/production-progress/:id` | Update batch progress (auto-caps at 100%) |
| `GET` | `/api/alerts` | List system notifications |
| `PUT` | `/api/alerts/:id/read` | Mark alert as acknowledged |

---

## 🔑 Test Credentials

| Role | Username | Password | Email |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | `admin@foodmfg.com` |
| **Production Manager** | `prod_manager` | `manager123` | `prodmgr@foodmfg.com` |
| **Inventory Manager** | `inv_manager` | `manager123` | `invmgr@foodmfg.com` |

---

## 🧪 Testing & Verification

1. **Automated Backend Audit**:
   Run the test suite verifying all 18 backend points and business calculations:
   ```bash
   cd server
   node scratch_audit.js
   ```
   *Result*: **24 / 24 Checks Passed** (0 Failures).

2. **Frontend Compilation**:
   ```bash
   cd client
   npm run build
   ```
   *Result*: Clean Vite production build with 0 errors.

---

## 🔮 Future Enhancements
- IoT sensor integration for automated batch weight and temperature logging.
- Expiration date and shelf-life tracking for perishable organic ingredients (FIFO/FEFO).
- Supplier purchase order generation when `LOW_STOCK` alerts fire.
- Multi-warehouse inventory routing and cold-chain monitoring.
