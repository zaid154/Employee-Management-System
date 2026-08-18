# 🏢 PeoplePay — Employee Management & Payroll System (MERN)

A modern, full-stack **MERN (MongoDB, Express.js, React, Node.js)** Employee Management & Payroll web application. Built for streamlined HR operations, employee record keeping, attendance tracking, leave approval workflows, automated payroll calculation, performance evaluations, and granular role-based access control.

---

## 🌟 Key Features

### 📊 1. Dynamic HR Dashboard & Analytics
- **Live Metric Cards**: Total headcount, active leaves, monthly payroll budget, and daily attendance percentages.
- **Visual Analytics**: Interactive charts showing department employee distributions and monthly payroll trends.
- **Quick Action Center**: Clock-in/out shortcuts, new leave requests, and instant employee onboarding.
- **Live Notice Board**: Recent company announcements and upcoming holiday reminders.

### 👥 2. Employee Directory & Profiles
- **Comprehensive Profiles**: Personal information, job title, department, employment status (Full-Time, Part-Time, Contract, Intern), and joining date.
- **Financial & Banking Details**: Salary structures, bank account numbers, IFSC codes, PAN/Tax IDs.
- **Filtering & Search**: Instant full-text search by name, email, department, or employment status.

### 🏢 3. Department Management
- Create, update, and manage company departments.
- Assign department heads and track employee counts per department.

### ⏰ 4. Attendance & Time Tracking
- **One-Click Check-In / Check-Out**: Direct attendance marking for employees with timestamp logging.
- **Status Classification**: Present, Absent, Half-Day, Late, or On-Leave.
- **Manager Overrides**: HR/Admin capability to add or edit attendance records.
- **Date Filters**: Filter attendance history by date ranges and specific employees.

### 🌴 5. Leave Management & Approval Workflow
- **Multi-Type Leave Requests**: Sick Leave, Casual Leave, Paid Time Off (PTO), Maternity/Paternity Leave, and Unpaid Leave.
- **Approval Flow**: Managers and HR can review, approve, or reject leave requests with review notes.
- **Leave Balance Tracker**: Real-time visibility into consumed vs. available leave balances.

### 💰 6. Automated Payroll & Payslip Generation
- **Salary Computation**: Auto-calculates gross salary, basic pay, HRA, allowances, tax deductions (PF/TDS), and net payable amount.
- **Batch Processing**: Generate monthly payslips for all active employees in one click.
- **Payslip Status**: Draft, Processing, Paid, or Cancelled status tracking.
- **Printable Payslips**: Employee-facing downloadable and printable payslip view.

### 🎯 7. Performance Reviews & KPI Ratings
- Structured periodic performance evaluations (Quarterly / Annual).
- Metric ratings (1-5 stars) across communication, technical skills, productivity, and leadership.
- Reviewer feedback, self-evaluations, and goal tracking.

### 📢 8. Announcements & Holiday Calendar
- Company-wide broadcast bulletin for HR notices and policies.
- Centralized holiday calendar with upcoming event alerts.

### 📈 9. Reports & Data Export
- Comprehensive payroll summary reports.
- Attendance statistics and department headcount exports.

### 🔒 10. Role-Based Access Control (RBAC) & Security
- **4 Distinct Roles**:
  - 👑 **Admin**: Full system control, configuration, database management.
  - 💼 **HR**: Employee onboarding, department handling, leave approvals, payroll execution.
  - 👔 **Manager**: Team attendance, team leave approvals, performance evaluations.
  - 👤 **Employee**: Personal profile, self attendance, leave requests, payslip viewing.
- **Secure Authentication**: JWT with HTTP-only cookies / Bearer headers, bcrypt password hashing.
- **Security Middleware**: Helmet headers, express-rate-limit, Zod request body validation, and CORS protection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Framer Motion, Lucide Icons, React Hot Toast, Axios, Vanilla CSS Design System |
| **Backend** | Node.js, Express.js, Mongoose ODM, JSON Web Token (JWT), Bcrypt.js, Zod, Helmet, Morgan, Compression |
| **Database** | MongoDB / MongoDB Atlas |

---

## 📁 Project Structure

```text
├── .env.example              # Example environment configuration
├── package.json              # Root package scripts & dev orchestration
├── client/                   # React + Vite Frontend
│   ├── public/               # Static assets & favicon
│   ├── src/
│   │   ├── components/       # Layouts, Topbar, Sidebar, Forms, Charts & UI components
│   │   ├── lib/              # Axios instance, Auth context, Theme context, Constants
│   │   ├── pages/            # Dashboard, Employees, Attendance, Payroll, Leaves, etc.
│   │   ├── styles.css        # Global CSS design tokens & responsive styles
│   │   ├── App.jsx           # App routing with protected role gates & animations
│   │   └── main.jsx          # React DOM entry point
│   ├── index.html            # Vite HTML template
│   └── vite.config.js        # Vite dev server & proxy settings
└── server/                   # Express.js REST API
    ├── src/
    │   ├── config/           # Database connection (db.js) & Env validation (env.js)
    │   ├── controllers/      # Route controllers (Auth, Employee, Payroll, Attendance, etc.)
    │   ├── middleware/       # JWT auth guard, Role validator, Rate limiting, Error handler
    │   ├── models/           # Mongoose schemas (User, Employee, Attendance, Leave, Payroll, etc.)
    │   ├── routes/           # REST API routes
    │   ├── services/         # Business logic services (Payroll calculation, metrics)
    │   ├── utils/            # Helper functions & response formatters
    │   ├── validators/       # Zod schemas for request validation
    │   ├── app.js            # Express app configuration & middleware
    │   ├── index.js          # Server bootstrap entry point
    │   └── seed.js           # Database seeder with complete sample dataset
    └── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (Node 20+ or 24 recommended)
- **MongoDB**: Local MongoDB instance or free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas)

---

### 2. Installation

Clone the repository and install all root, server, and client dependencies:

```bash
# Clone the repository
git clone <repo-url>
cd "Employee Management & Payroll System"

# Install all dependencies (Root, Server, and Client)
npm run install:all
```

---

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# ---- Server Configuration ----
PORT=5002
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ems_payroll?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# ---- Default Admin (Used by seed script) ----
SEED_ADMIN_NAME=HR Admin
SEED_ADMIN_EMAIL=admin@ems.dev
SEED_ADMIN_PASSWORD=Admin@12345

# ---- Client Configuration ----
VITE_API_URL=/api
```

---

### 4. Database Seeding

Populate the database with sample departments, employees, attendance records, leaves, payslips, announcements, and holidays:

```bash
npm run seed
```

---

### 5. Running the Application

Start both the Backend API and Frontend Client simultaneously:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5002/api](http://localhost:5002/api)
- **Health Check**: [http://localhost:5002/api/health](http://localhost:5002/api/health)

---

## 🔑 Demo Credentials

After running `npm run seed`, you can sign in with any of the following pre-configured accounts:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ems.dev` | `Admin@12345` | Complete system access, settings, user management |
| **HR Manager** | `priya.nair@ems.dev` | `Password@123` | Employee CRUD, departments, payroll run, leave approvals |
| **Team Manager** | `aarav.sharma@ems.dev` | `Password@123` | Department attendance, team leave reviews, performance scoring |
| **Employee** | `rohan.mehta@ems.dev` | `Password@123` | Personal attendance, leave requests, personal payslips |

---

## 📡 API Reference Overview

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET  /api/auth/me` — Retrieve current authenticated user profile
- `POST /api/auth/logout` — Invalidate user session
- `PUT  /api/auth/profile` — Update self profile details

### 👥 Employees (`/api/employees`)
- `GET    /api/employees` — List all employees (supports pagination, search, filter)
- `POST   /api/employees` — Onboard new employee *(Admin/HR)*
- `GET    /api/employees/:id` — Get employee profile details
- `PUT    /api/employees/:id` — Update employee record *(Admin/HR)*
- `DELETE /api/employees/:id` — Deactivate / Remove employee *(Admin/HR)*

### 🏢 Departments (`/api/departments`)
- `GET    /api/departments` — List departments & headcount
- `POST   /api/departments` — Create new department *(Admin/HR)*
- `PUT    /api/departments/:id` — Update department details *(Admin/HR)*
- `DELETE /api/departments/:id` — Remove department *(Admin/HR)*

### ⏱️ Attendance (`/api/attendance`)
- `GET  /api/attendance` — View attendance logs (Filtered by date/employee)
- `POST /api/attendance/check-in` — Check in current user
- `POST /api/attendance/check-out` — Check out current user
- `POST /api/attendance/manual` — Manually record/adjust attendance *(Admin/HR/Manager)*

### 🌴 Leaves (`/api/leaves`)
- `GET  /api/leaves` — List leave requests (Role-scoped)
- `POST /api/leaves` — Submit new leave application
- `PUT  /api/leaves/:id/status` — Approve or Reject leave request *(Admin/HR/Manager)*

### 💵 Payroll (`/api/payroll`)
- `GET  /api/payroll` — List payslips (Filtered by month/year/employee)
- `POST /api/payroll/generate` — Generate monthly payslip batch *(Admin/HR)*
- `GET  /api/payroll/:id` — Fetch single payslip breakdown
- `PUT  /api/payroll/:id/status` — Update payslip status (Mark as Paid) *(Admin/HR)*

### 📊 Dashboard & Metrics (`/api/dashboard`)
- `GET /api/dashboard/stats` — Aggregate metrics, department distribution, monthly payroll chart data

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both backend Express server and Vite frontend concurrently |
| `npm run dev:server` | Runs backend server with native Node `--watch` reload |
| `npm run dev:client` | Runs frontend Vite dev server |
| `npm run seed` | Seeds database with sample HR data and demo accounts |
| `npm run build` | Builds production-ready frontend bundle |
| `npm run lint` | Runs ESLint on client codebase |
| `npm run install:all` | Installs root, server, and client dependencies |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
