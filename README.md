# 🏢 PeoplePay — Enterprise HRMS, Employee Management & Payroll System (MERN)

A modern, enterprise-grade **MERN (MongoDB, Express.js, React 18, Node.js)** Human Resource Management & Payroll web application. Engineered with zero-trust account provisioning, email OTP verification, admin employee onboarding, Cloudinary-backed document verification, automated statutory payroll calculation, real transaction disbursement recording, performance evaluations, and role-based access control (RBAC).

---

## 🌟 Key Features & Workflows

### 🔐 1. Enterprise Authentication & Security Lifecycle
- **Zero-Trust Public Registration**: Self-service role selection is completely removed from public signup. Users cannot escalate privileges or provision internal employee IDs.
- **Minimal, Validated Registration Form**: Full legal name, corporate work email, mobile number with country code, and strong password.
- **Dual-Provider Email OTP Verification**: Real-time 6-digit OTP delivery powered by **Gmail SMTP (Nodemailer)** with automatic failover to **Brevo API (Sendinblue)**.
- **Brute-Force & Rate Limiting**: 15-minute OTP expiration, 5-attempt security lock, and a 60-second resend cooldown timer.
- **Account State Machine**:
  $$\text{Registered} \xrightarrow{\text{OTP Verified}} \text{PENDING\_ADMIN\_APPROVAL} \xrightarrow{\text{Admin Review}} \text{ACTIVE} \xrightarrow{\text{Full Access}} \text{Authorized}$$
- **1-Click Quick Demo Personas**: Instant evaluation buttons on the sign-in screen for `Admin`, `HR Manager`, `Team Manager`, and `Employee`.
- **Responsive Viewport Design**: Optimized for standard $1366 \times 768$ laptop screens and mobile devices without awkward clipping, hidden buttons, or misaligned inputs.

### 👥 2. Admin Employee Onboarding & Review
- **Pending Onboarding Pipeline**: Dedicated review segment in the employee directory for applicants who have verified their emails.
- **Review & Onboard Workflow**: Authorized Admins/HR assign corporate attributes:
  - System role (`employee`, `manager`, `hr`)
  - Unique Employee ID
  - Department & Designation
  - Employment Type (`full-time`, `part-time`, `contract`, `intern`)
  - Date of Joining
  - Salary Breakdown (Basic, HRA, Allowances, PF, Professional Tax)
  - Bank Disbursement Details (Account Number, Bank Name, IFSC code)
- **Automated Activation Notification**: Activating an applicant triggers an official welcome email containing login confirmation.
- **Rejection Workflow**: Audit-tracked candidate rejection with custom compliance notes.

### 📄 3. Cloudinary Document Verification & Avatar Upload
- **Cloudinary CDN Integration**: Secure media hosting for employee profile photos and compliance documents.
- **Instant Avatar Upload**: One-click photo upload directly from the employee profile avatar overlay.
- **Statutory Document Storage**: Dedicated "Documents & Verification" tab supporting:
  - 🆔 **Aadhaar Card**
  - 💳 **PAN Card**
  - 🛂 **Passport**
  - 🎓 **Educational Degree / Certificates**
  - 📝 **Resume / CV**
  - 🏦 **Bank Passbook / Cancelled Cheque**
- **Admin Verification Workflow**: Admins review uploaded documents (PDF, PNG, JPG up to 10MB) and mark them as `verified` or `rejected` with audit remarks.

### 💰 4. Monthly Payroll & Real Transaction Recording
- **Statutory Salary Calculation**: Automatic computation of Gross Salary, Basic Pay, HRA, Allowances, Provident Fund (PF), Professional Tax, Loss of Pay (LOP) from leave days, and Net Payable salary.
- **Batch Processing**: Run payroll for all active employees across a pay period in a single click.
- **Real Transaction Disbursement**: Payslips are never marked paid automatically. Admins disburse salaries via the **Record Payment Modal**:
  - Payment Method: Direct Bank Transfer / NEFT / RTGS, UPI Corporate Transfer, Company Cheque, Cash.
  - Transaction Reference / UTR Number tracking with quick **Auto-Gen** helper.
  - Payment date and audit remarks.
- **Payslip Statements**: Downloadable and printable payslip statements displaying company tax ID, earnings, deductions, UTR reference, payment method, and disbursing admin name.

### ⏰ 5. Attendance & Time Tracking
- **One-Click Check-In / Check-Out**: Direct attendance marking for employees with timestamp logging.
- **Status Classification**: Present, Absent, Half-Day, Late, On-Leave, Holiday, Weekend.
- **Manager Overrides**: HR/Admin capability to adjust or manually log attendance records.
- **Date & Employee Filtering**: Instant attendance auditing by date ranges and department.

### 🌴 6. Leave Management & Approval Workflow
- **Multi-Type Leave Requests**: Sick Leave, Casual Leave, Earned Leave (PTO), Maternity/Paternity Leave, and Unpaid Leave.
- **Two-Tier Approval Flow**: Managers and HR can review, approve, or reject leave requests with review notes.
- **Leave Balance Engine**: Real-time tracking of consumed vs. available leave balances per employee.

### 🎯 7. Performance Reviews & KPI Ratings
- Structured periodic performance evaluations (Quarterly / Annual).
- 5-Star metric ratings across Productivity, Quality, Communication, Teamwork, and Leadership.
- Reviewer feedback, self-evaluations, and goal weightage tracking.

### 📢 8. Announcements & Holiday Calendar
- Company-wide broadcast board for HR notices and policy updates.
- Centralized holiday calendar with public, optional, and company holiday classifications.

### 🔒 9. Role-Based Access Control (RBAC) & Security
- **4 Distinct Roles**:
  - 👑 **Admin**: Complete system control, user approval, department configuration, database management.
  - 💼 **HR**: Candidate onboarding, document verification, leave approval, payroll generation & disbursement.
  - 👔 **Manager**: Department attendance, team leave approvals, performance evaluations.
  - 👤 **Employee**: Personal profile, self-attendance, leave applications, personal payslips & document uploads.
- **Security Stack**: JWT with HTTP-only cookies / Bearer headers, bcrypt password hashing, Helmet headers, express-rate-limit, Zod request body validation, and CORS protection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Framer Motion, Lucide Icons, React Hot Toast, Axios, Vanilla CSS Design System |
| **Backend** | Node.js, Express.js, Mongoose ODM, JSON Web Token (JWT), Bcrypt.js, Zod, Nodemailer, Cloudinary SDK, Helmet, Morgan, Compression |
| **Database** | MongoDB / MongoDB Atlas |
| **Email & Cloud** | Gmail SMTP, Brevo API (Sendinblue), Cloudinary Media Storage |

---

## 📁 Project Structure

```text
├── .env.example              # Environment configuration template
├── package.json              # Root orchestration scripts
├── client/                   # React + Vite Frontend
│   ├── public/               # Static assets & brand logos
│   ├── src/
│   │   ├── components/       # Layouts, Topbar, Sidebar, UI components (Modal, Badge, Table)
│   │   ├── lib/              # Axios instance, Auth context, Formatters, Constants
│   │   ├── pages/            # Dashboard, Employees, EmployeeDetail, Attendance, Payroll, Leaves, Login, etc.
│   │   ├── styles.css        # Enterprise design system & responsive rules
│   │   ├── App.jsx           # Role-based route guard definitions
│   │   └── main.jsx          # React DOM entry point
│   ├── index.html            # Vite HTML template
│   └── vite.config.js        # Vite dev server configuration
└── server/                   # Express.js REST API
    ├── src/
    │   ├── config/           # Database connection & Environment validation
    │   ├── controllers/      # Auth, Employee, Payroll, Attendance, Leave, etc.
    │   ├── middleware/       # JWT auth guard, Role validator, Rate limiting, Zod validator
    │   ├── models/           # Mongoose schemas (User, Employee, Attendance, Leave, Payroll, etc.)
    │   ├── routes/           # Express REST API routes
    │   ├── services/         # Email service (SMTP+Brevo), Cloudinary service, Payroll engine
    │   ├── utils/            # Access scopes, constants, error classes, async handlers
    │   ├── validators/       # Zod validation schemas
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
- **Email Credentials**: Gmail App Password or Brevo API Key
- **Cloudinary Account**: Cloud name, API key, and API secret

---

### 2. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/zaid154/Employee-Management-System.git
cd Employee-Management-System

# Install all dependencies (Root, Server, and Client)
npm run install:all
```

---

### 3. Environment Configuration

Create a `.env` file in the root or `server/` directory:

```env
# ---- Server Configuration ----
PORT=5002
MONGO_URI=mongodb://127.0.0.1:27017/ems_payroll
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# ---- Email / SMTP / Brevo Configuration ----
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_verified_sender_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
BREVO_API_KEY=your_brevo_api_key_for_failover

# ---- Cloudinary Configuration ----
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ---- Default Admin (Seed Script) ----
SEED_ADMIN_NAME=HR Admin
SEED_ADMIN_EMAIL=admin@ems.dev
SEED_ADMIN_PASSWORD=Admin@12345
```

---

### 4. Database Seeding

Populate the database with sample departments, employees, attendance logs, leave balances, payslips, and demo user accounts:

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

After running `npm run seed`, you can sign in with any of the pre-configured accounts (or use the 1-click Quick Demo Persona buttons on the login screen):

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ems.dev` | `Admin@12345` | Complete system access, employee onboarding, system configuration |
| **HR Manager** | `priya.nair@ems.dev` | `Password@123` | Employee directory, document verification, payroll runs & disbursement |
| **Team Manager** | `aarav.sharma@ems.dev` | `Password@123` | Team attendance, team leave reviews, performance ratings |
| **Employee** | `rohan.mehta@ems.dev` | `Password@123` | Self-service attendance, leave requests, document uploads, personal payslips |

---

## 📡 Key API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Public registration (Name, Email, Phone, Password)
- `POST /api/auth/verify-email` — Verify email using 6-digit OTP
- `POST /api/auth/resend-code` — Resend verification OTP (with cooldown rate limit)
- `POST /api/auth/login` — Sign in and receive JWT token & user session
- `GET  /api/auth/me` — Retrieve authenticated user profile
- `POST /api/auth/logout` — Invalidate user session
- `POST /api/auth/forgot-password` — Request password reset email
- `POST /api/auth/reset-password` — Reset password with verification code
- `GET  /api/auth/pending-registrations` — Fetch applicants awaiting Admin review *(Admin/HR)*

### 👥 Employees & Onboarding (`/api/employees`)
- `GET    /api/employees` — List all employees (Search, filter, pagination)
- `POST   /api/employees` — Directly create employee record *(Admin/HR)*
- `GET    /api/employees/:id` — Get full employee profile
- `PUT    /api/employees/:id` — Update employee information *(Admin/HR)*
- `DELETE /api/employees/:id` — Archive / Terminate employee *(Admin/HR)*
- `POST   /api/employees/approve-registration/:id` — Onboard and activate candidate account *(Admin/HR)*
- `POST   /api/employees/reject-registration/:id` — Reject registration with reason *(Admin/HR)*
- `POST   /api/employees/:id/avatar` — Upload profile photo to Cloudinary
- `POST   /api/employees/:id/documents` — Upload compliance document to Cloudinary
- `PATCH  /api/employees/:id/documents/:docId/verify` — Approve or reject document *(Admin/HR)*
- `DELETE /api/employees/:id/documents/:docId` — Delete uploaded document

### 💵 Payroll & Compensation (`/api/payroll`)
- `GET    /api/payroll` — List payslips (Scoped by role, filter by month/year/status)
- `POST   /api/payroll/generate` — Generate monthly payroll batch *(Admin/HR)*
- `GET    /api/payroll/:id` — View full payslip breakdown & bank info
- `PATCH  /api/payroll/:id` — Adjust draft/calculated payslip earnings & deductions *(Admin/HR)*
- `PATCH  /api/payroll/:id/pay` — Record verified disbursement (UTR/Reference, method, date, notes) *(Admin/HR)*
- `DELETE /api/payroll/:id` — Delete un-disbursed payslip *(Admin/HR)*

### ⏱️ Attendance (`/api/attendance`)
- `GET  /api/attendance` — View attendance logs (Filtered by date, department, employee)
- `POST /api/attendance/check-in` — Check in current user
- `POST /api/attendance/check-out` — Check out current user
- `POST /api/attendance/manual` — Manually record/adjust attendance *(Admin/HR/Manager)*

### 🌴 Leaves (`/api/leaves`)
- `GET  /api/leaves` — List leave requests (Role-scoped)
- `POST /api/leaves` — Submit new leave application
- `PUT  /api/leaves/:id/status` — Approve or Reject leave request *(Admin/HR/Manager)*

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both backend Express server and Vite frontend concurrently |
| `npm run dev:server` | Runs backend server with native Node `--watch` reload |
| `npm run dev:client` | Runs frontend Vite dev server |
| `npm run seed` | Seeds database with sample HR data and demo accounts |
| `npm run build` | Builds production-ready frontend bundle (`vite build`) |
| `npm run install:all` | Installs root, server, and client dependencies |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
