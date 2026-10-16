# PeoplePay — Enterprise HRMS & Payroll System

PeoplePay is a full-stack MERN (MongoDB, Express, React 18, Node.js) Human Resource Management and Payroll application designed for corporate workforce operations. It covers the full employee lifecycle: onboarding, identity verification via OTP, attendance tracking, leave workflows, statutory payroll calculation, salary disbursement with transaction reference tracking, and downloadable PDF payslips.

---

## Architecture Overview

```
                      ┌────────────────────────┐
                      │   React 18 + Vite SPA  │
                      │   (Tailored CSS / UX)  │
                      └───────────┬────────────┘
                                  │ Axios (/api)
                                  ▼
                      ┌────────────────────────┐
                      │  Express 4 REST API    │
                      │  JWT + RBAC + Zod      │
                      └─────┬────────────┬─────┘
                            │            │
            ┌───────────────┘            └───────────────┐
            ▼                                            ▼
┌────────────────────────┐                  ┌────────────────────────┐
│   MongoDB / Atlas      │                  │  Third-Party Services  │
│   (Mongoose Schemas)   │                  │  - Cloudinary (Files)  │
│   - Employees, Users   │                  │  - Gmail SMTP / Brevo  │
│   - Payroll, Leaves    │                  └────────────────────────┘
│   - Attendance Logs    │
└────────────────────────┘
```

---

## Key Modules & Capabilities

### 1. Authentication & Role-Based Access (RBAC)
- **Role Hierarchy**: `admin`, `hr`, `manager`, `employee`.
- **Public Signup with Admin Approval**: Public accounts verify their work email via a 6-digit OTP and land in a `pending_approval` queue. Privileged roles assign departments, designations, and salary structures before granting access.
- **Dual Email Transport**: Automated OTP and alert delivery through Gmail SMTP with Brevo API fallback.
- **Session Security**: Stateless JWT authentication with Bearer tokens, bcrypt salt hashing, and rate-limited endpoints.

### 2. Employee Directory & Document Compliance
- Complete employee directory with profile cards, designation filters, and full profile editing.
- **Document Management**: Upload compliance records (Aadhaar, PAN, Passport, Certificates, Resume) stored directly on Cloudinary CDN with Admin verification flags (`verified` / `rejected`).
- **Profile Avatars**: Instant photo uploads with automatic CDN optimization.

### 3. Payroll Engine & Salary Disbursement
- **Statutory Calculation**: Automatic computation of Gross Salary, Basic Pay, HRA, Conveyance, PF, Professional Tax, TDS deductions, and Loss of Pay (LOP) derived from attendance records.
- **Disbursement Tracking**: Mark payroll as paid with real banking metadata:
  - Payment modes: Bank Transfer (NEFT/IMPS/RTGS), UPI, Cheque, Cash.
  - Transaction Reference / UTR Number tracking.
  - Audit metadata recording disbursing admin and timestamp.
- **Automated Salary Disbursed Email**: Confirmed salary disbursements immediately dispatch a branded email notification to the employee containing pay period details, credited amount, payment method, and UTR reference number.
- **Direct PDF Payslip Export**: Employees and HR admins can download formatted, high-resolution PDF salary slips directly using the integrated `html2pdf.js` engine or print them via standard print styles.

### 4. Attendance & Time Tracking
- Single-click Punch In / Punch Out with timestamps.
- Daily status tracking: Present, Absent, Half-Day, Late, On-Leave.
- Date range filtering, search, and manager manual override capability.

### 5. Leave Management
- Applications for Casual, Sick, Earned (PTO), and Unpaid leaves.
- Two-tier approval system (Manager and HR) with review comments and cancellation safeguards.
- Real-time leave balance deduction and tracking per leave category.

### 6. Holidays & Announcements
- Centralized holiday calendar with custom categories (National, Festival, Optional) and long-weekend badge indicators.
- Broadcast board for company-wide HR notices.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Lucide Icons, React Hot Toast, html2pdf.js, Axios, Vanilla CSS design tokens.
- **Backend**: Node.js, Express 4, Mongoose ODM, JWT, Bcrypt.js, Zod, Nodemailer, Cloudinary SDK, Helmet, Compression.
- **Database**: MongoDB (Local or MongoDB Atlas).
- **Email Delivery**: SMTP (Gmail) + Brevo HTTP API.

---

## Project Structure

```
.
├── package.json              # Concurrently scripts for dev/build
├── client/                   # Vite React SPA
│   ├── src/
│   │   ├── components/       # UI library: DataTable, Modal, Badges, Header
│   │   ├── lib/              # Auth context, Axios API client, Formatters
│   │   ├── pages/            # Dashboard, Employees, Payroll, Attendance, Leaves, Login, Settings
│   │   └── styles.css        # Enterprise design system
│   └── vite.config.js        # Dev proxy (/api -> :5002)
└── server/                   # Express REST API
    ├── src/
    │   ├── config/           # DB & environment variables
    │   ├── controllers/      # Auth, Employee, Payroll, Attendance, Leave
    │   ├── middleware/       # Auth guards, RBAC, Zod validation
    │   ├── models/           # Mongoose schemas (User, Employee, Payroll, etc.)
    │   ├── routes/           # Express router definitions
    │   ├── services/         # Email notifications, Cloudinary, Payroll engine
    │   └── seed.js           # Database seeder with sample dataset
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB instance (local or MongoDB Atlas cluster)

### 1. Installation
Clone the repository and install dependencies across root, server, and client:

```bash
git clone https://github.com/zaid154/Employee-Management-System.git
cd Employee-Management-System

npm run install:all
```

### 2. Environment Setup
Configure your environment in a `.env` file at the project root:

```ini
# Server
PORT=5002
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ems_payroll?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# First Admin User (used by npm run seed)
SEED_ADMIN_NAME=HR Admin
SEED_ADMIN_EMAIL=admin@ems.dev
SEED_ADMIN_PASSWORD=Admin@12345

# Email Transports (Optional for local dev, console fallback active by default)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
BREVO_API_KEY=your_brevo_api_key

# Cloudinary (Optional, for document and photo uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client
VITE_API_URL=/api
```

### 3. Database Seeding
To populate initial departments, employees, historical attendance, and demo accounts:

```bash
npm run seed
```

### 4. Running the Development Servers
Start both the Express API and Vite client with a single command:

```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5002/api`
- **API Health Check**: `http://localhost:5002/api/health`

---

## Seed Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ems.dev` | `Admin@12345` | Complete access, settings, account onboarding |
| **HR Manager** | `priya.nair@ems.dev` | `Password@123` | Employee onboarding, document verification, payroll runs |
| **Team Manager** | `aarav.sharma@ems.dev` | `Password@123` | Team attendance, leave approvals, evaluations |
| **Employee** | `rohan.mehta@ems.dev` | `Password@123` | Personal profile, attendance, leave requests, payslips |

---

## Primary API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Public registration
- `POST /api/auth/verify-email` — Submit 6-digit verification OTP
- `POST /api/auth/login` — Sign in and obtain JWT
- `GET  /api/auth/me` — Current authenticated session
- `POST /api/auth/forgot-password` — Password recovery trigger

### Employees (`/api/employees`)
- `GET  /api/employees` — List employees with search, pagination, and department filters
- `POST /api/employees` — Create an employee record (Admin/HR)
- `GET  /api/employees/:id` — Full employee profile details
- `PUT  /api/employees/:id` — Update personal or employment info
- `POST /api/employees/approve-registration/:id` — Activate applicant and assign role
- `POST /api/employees/:id/documents` — Upload compliance document
- `PATCH /api/employees/:id/documents/:docId/verify` — Set document status to verified/rejected

### Payroll (`/api/payroll`)
- `GET   /api/payroll` — List payslips (scoped by role, filterable by month/year)
- `POST  /api/payroll/generate` — Generate monthly payslip batch (Admin/HR)
- `GET   /api/payroll/:id` — Single payslip statement with breakdown
- `PATCH /api/payroll/:id/pay` — Confirm payment disbursement with UTR and trigger email alert
- `DELETE /api/payroll/:id` — Remove un-paid payslip

### Attendance & Leaves (`/api/attendance`, `/api/leaves`)
- `POST /api/attendance/check-in` — Record daily check-in
- `POST /api/attendance/check-out` — Record daily check-out
- `GET  /api/leaves` — List leave applications
- `POST /api/leaves` — Submit time-off request
- `PATCH /api/leaves/:id/review` — Approve or reject leave request

---

## License

This project is licensed under the [MIT License](LICENSE).
