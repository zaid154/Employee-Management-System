/**
 * Seed the database with a realistic demo dataset: departments, employees with
 * login accounts across every role, attendance for the current month, leave
 * requests, last month's payroll, performance reviews, holidays, and notices.
 *
 * Run with: npm run seed  (from the project root or the server folder)
 */
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { Employee } from './models/Employee.js';
import { Department } from './models/Department.js';
import { Attendance } from './models/Attendance.js';
import { Leave } from './models/Leave.js';
import { Payroll } from './models/Payroll.js';
import { Performance } from './models/Performance.js';
import { Announcement } from './models/Announcement.js';
import { Holiday } from './models/Holiday.js';
import { DEFAULT_LEAVE_BALANCE, ROLES } from './utils/constants.js';
import { computePayslip } from './services/payroll.service.js';
import { startOfDay, isWeekend } from './utils/dates.js';

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG', description: 'Product development and platform engineering' },
  { name: 'Human Resources', code: 'HR', description: 'People operations, hiring, and culture' },
  { name: 'Sales', code: 'SAL', description: 'Revenue, accounts, and partnerships' },
  { name: 'Marketing', code: 'MKT', description: 'Brand, growth, and demand generation' },
  { name: 'Finance', code: 'FIN', description: 'Accounting, payroll, and compliance' },
  { name: 'Operations', code: 'OPS', description: 'Facilities, IT support, and logistics' },
];

// firstName, lastName, gender, dept code, designation, isLead, monthly basic (INR)
const PEOPLE = [
  ['Aarav', 'Sharma', 'male', 'ENG', 'Engineering Manager', true, 90000],
  ['Isha', 'Verma', 'female', 'ENG', 'Senior Software Engineer', false, 68000],
  ['Rohan', 'Mehta', 'male', 'ENG', 'Software Engineer', false, 52000],
  ['Neha', 'Gupta', 'female', 'ENG', 'Frontend Engineer', false, 50000],
  ['Karan', 'Singh', 'male', 'ENG', 'DevOps Engineer', false, 58000],
  ['Priya', 'Nair', 'female', 'HR', 'HR Manager', true, 72000],
  ['Anjali', 'Rao', 'female', 'HR', 'HR Executive', false, 38000],
  ['Vikram', 'Malhotra', 'male', 'SAL', 'Sales Head', true, 85000],
  ['Sneha', 'Kapoor', 'female', 'SAL', 'Account Executive', false, 45000],
  ['Arjun', 'Reddy', 'male', 'SAL', 'Sales Associate', false, 36000],
  ['Meera', 'Iyer', 'female', 'MKT', 'Marketing Lead', true, 70000],
  ['Rahul', 'Joshi', 'male', 'MKT', 'Content Strategist', false, 42000],
  ['Divya', 'Menon', 'female', 'MKT', 'Digital Marketer', false, 40000],
  ['Sanjay', 'Patel', 'male', 'FIN', 'Finance Manager', true, 88000],
  ['Pooja', 'Desai', 'female', 'FIN', 'Accountant', false, 44000],
  ['Amit', 'Kumar', 'male', 'OPS', 'Operations Manager', true, 66000],
  ['Ritu', 'Chauhan', 'female', 'OPS', 'IT Support Specialist', false, 39000],
  ['Farhan', 'Khan', 'male', 'OPS', 'Facilities Coordinator', false, 34000],
];

async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Department.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Payroll.deleteMany({}),
    Performance.deleteMany({}),
    Announcement.deleteMany({}),
    Holiday.deleteMany({}),
  ]);
}

function buildSalary(basic) {
  return {
    basic,
    hra: Math.round(basic * 0.4),
    allowances: Math.round(basic * 0.25),
    pf: Math.round(basic * 0.12),
    professionalTax: 200,
  };
}

async function run() {
  await connectDB();
  console.log('🌱 Seeding EMS & Payroll database...');
  await clearAll();

  // 1. Departments
  const deptDocs = await Department.insertMany(DEPARTMENTS);
  const deptByCode = Object.fromEntries(deptDocs.map((d) => [d.code, d]));
  console.log(`   • ${deptDocs.length} departments`);

  // 2. Employees (leads first so we can wire up managers)
  const sorted = [...PEOPLE].sort((a, b) => Number(b[5]) - Number(a[5]));
  const leadByDept = {};
  const employees = [];
  let seq = 0;

  for (const [firstName, lastName, gender, code, designation, isLead, basic] of sorted) {
    seq += 1;
    const joinYearsAgo = rand(0, 4);
    const dateOfJoining = new Date();
    dateOfJoining.setFullYear(dateOfJoining.getFullYear() - joinYearsAgo, rand(0, 11), rand(1, 28));

    const emp = await Employee.create({
      employeeId: `EMP${String(seq).padStart(4, '0')}`,
      firstName,
      lastName,
      email: `${firstName}.${lastName}`.toLowerCase() + '@ems.dev',
      phone: `+91 9${rand(100000000, 999999999)}`,
      gender,
      designation,
      department: deptByCode[code]._id,
      manager: isLead ? null : leadByDept[code]?._id || null,
      employmentType: pick(['full-time', 'full-time', 'full-time', 'contract', 'intern']),
      status: 'active',
      dateOfJoining,
      salary: buildSalary(basic),
      leaveBalance: new Map(Object.entries(DEFAULT_LEAVE_BALANCE)),
      bank: { accountName: `${firstName} ${lastName}`, accountNumber: String(rand(10000000, 99999999)), bankName: 'HDFC Bank', ifsc: 'HDFC0001234' },
    });
    if (isLead) leadByDept[code] = emp;
    employees.push({ emp, isLead, code });
  }
  console.log(`   • ${employees.length} employees`);

  // Set department heads
  for (const code of Object.keys(leadByDept)) {
    await Department.findByIdAndUpdate(deptByCode[code]._id, { head: leadByDept[code]._id });
  }

  // 3. Login accounts — admin + one account per role for the demo
  await User.create({
    name: env.seedAdmin.name,
    email: env.seedAdmin.email,
    password: env.seedAdmin.password,
    role: ROLES.ADMIN,
  });

  const accounts = [
    { find: (e) => e.emp.designation === 'HR Manager', role: ROLES.HR },
    { find: (e) => e.emp.designation === 'Engineering Manager', role: ROLES.MANAGER },
    { find: (e) => e.emp.designation === 'Software Engineer', role: ROLES.EMPLOYEE },
  ];
  const demoLogins = [{ email: env.seedAdmin.email, password: env.seedAdmin.password, role: 'admin' }];

  for (const acc of accounts) {
    const match = employees.find(acc.find);
    if (!match) continue;
    const user = await User.create({
      name: match.emp.fullName,
      email: match.emp.email,
      password: 'Password@123',
      role: acc.role,
      employee: match.emp._id,
    });
    match.emp.user = user._id;
    await match.emp.save();
    demoLogins.push({ email: match.emp.email, password: 'Password@123', role: acc.role });
  }

  // 4. Attendance for the current month (working days up to today)
  const now = new Date();
  const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const attendanceOps = [];
  for (const { emp } of employees) {
    const cursor = new Date(monthStart);
    while (cursor <= now) {
      if (!isWeekend(cursor)) {
        const roll = Math.random();
        let status = 'present';
        let checkIn = new Date(cursor);
        let checkOut = new Date(cursor);
        let workHours = 0;
        if (roll < 0.05) {
          status = 'absent';
          checkIn = null;
          checkOut = null;
        } else {
          const late = roll > 0.85;
          status = late ? 'late' : 'present';
          checkIn.setHours(late ? rand(10, 11) : 9, rand(0, 59), 0, 0);
          checkOut.setHours(rand(17, 19), rand(0, 59), 0, 0);
          workHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
        }
        attendanceOps.push({
          employee: emp._id,
          date: startOfDay(cursor),
          checkIn,
          checkOut,
          status,
          workHours,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  await Attendance.insertMany(attendanceOps);
  console.log(`   • ${attendanceOps.length} attendance records`);

  // 5. Leave requests — a mix of pending / approved / rejected
  const leaveTypes = ['casual', 'sick', 'earned'];
  const reasons = ['Family function', 'Medical appointment', 'Personal work', 'Vacation', 'Not feeling well'];
  let leaveCount = 0;
  for (const { emp } of employees) {
    if (Math.random() > 0.55) continue;
    const type = pick(leaveTypes);
    const start = new Date(now.getFullYear(), now.getMonth(), rand(1, 25));
    const end = new Date(start);
    end.setDate(end.getDate() + rand(0, 3));
    const days = Math.max(1, Math.round((startOfDay(end) - startOfDay(start)) / 86400000) + 1);
    const status = pick(['pending', 'pending', 'approved', 'rejected']);
    await Leave.create({
      employee: emp._id,
      type,
      startDate: startOfDay(start),
      endDate: startOfDay(end),
      days,
      reason: pick(reasons),
      status,
      reviewedAt: status === 'pending' ? null : new Date(),
    });
    if (status === 'approved' && type !== 'unpaid') {
      const bal = emp.leaveBalance.get(type) ?? 0;
      emp.leaveBalance.set(type, Math.max(0, bal - days));
      await emp.save();
    }
    leaveCount += 1;
  }
  console.log(`   • ${leaveCount} leave requests`);

  // 6. Payroll for the previous month
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pMonth = prevMonthDate.getMonth() + 1;
  const pYear = prevMonthDate.getFullYear();
  const payrollDocs = [];
  for (const { emp } of employees) {
    const breakdown = await computePayslip(emp, { month: pMonth, year: pYear });
    payrollDocs.push({ ...breakdown, employee: emp._id, status: 'paid', paidAt: new Date(now.getFullYear(), now.getMonth(), 1) });
  }
  await Payroll.insertMany(payrollDocs);
  console.log(`   • ${payrollDocs.length} payslips (${pMonth}/${pYear})`);

  // 7. Performance reviews for non-leads
  const period = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
  let reviewCount = 0;
  for (const { emp, isLead, code } of employees) {
    if (isLead) continue;
    const r = () => rand(3, 5);
    await Performance.create({
      employee: emp._id,
      reviewer: leadByDept[code]?._id || null,
      period,
      ratings: { productivity: r(), quality: r(), communication: r(), teamwork: r(), leadership: rand(2, 4) },
      goals: [
        { title: 'Deliver assigned projects on time', weight: 40, rating: r(), comment: 'Consistently met deadlines' },
        { title: 'Improve collaboration', weight: 30, rating: r(), comment: '' },
        { title: 'Upskill in new tools', weight: 30, rating: r(), comment: 'Completed 2 certifications' },
      ],
      strengths: 'Reliable, strong ownership, good communicator.',
      improvements: 'Can take more initiative on cross-team projects.',
      reviewerComment: 'Solid performer this cycle.',
      status: pick(['submitted', 'submitted', 'acknowledged']),
    });
    reviewCount += 1;
  }
  console.log(`   • ${reviewCount} performance reviews`);

  // 8. Holidays for the current year
  const y = now.getFullYear();
  await Holiday.insertMany([
    { name: 'New Year', date: new Date(y, 0, 1), type: 'public' },
    { name: 'Republic Day', date: new Date(y, 0, 26), type: 'public' },
    { name: 'Holi', date: new Date(y, 2, 14), type: 'public' },
    { name: 'Independence Day', date: new Date(y, 7, 15), type: 'public' },
    { name: 'Gandhi Jayanti', date: new Date(y, 9, 2), type: 'public' },
    { name: 'Diwali', date: new Date(y, 10, 1), type: 'public' },
    { name: 'Christmas', date: new Date(y, 11, 25), type: 'public' },
    { name: 'Company Foundation Day', date: new Date(y, 5, 15), type: 'company' },
  ]);
  console.log('   • 8 holidays');

  // 9. Announcements
  const adminUser = await User.findOne({ role: ROLES.ADMIN });
  await Announcement.insertMany([
    {
      title: 'Welcome to the new HR Portal 🎉',
      body: 'Our new Employee Management & Payroll System is live. Check in daily, apply for leave, and download your payslips right here.',
      category: 'general',
      pinned: true,
      author: adminUser._id,
    },
    {
      title: 'Payroll for last month has been processed',
      body: 'Payslips are now available under the Payroll section. Reach out to Finance for any discrepancies.',
      category: 'policy',
      author: adminUser._id,
    },
    {
      title: 'Quarterly performance reviews are open',
      body: 'Managers, please complete your team reviews by the end of the month. Employees can acknowledge their reviews once submitted.',
      category: 'event',
      author: adminUser._id,
    },
  ]);
  console.log('   • 3 announcements');

  console.log('\n✅ Seed complete!\n');
  console.log('   Demo logins:');
  demoLogins.forEach((l) => console.log(`   - ${l.role.padEnd(9)} ${l.email} / ${l.password}`));
  console.log('');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
