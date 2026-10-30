/**
 * Master Enterprise Seeder for Employee Management & Payroll System
 *
 * Populates clean, realistic, production-ready demo dataset across all modules:
 * 1. Departments with assigned heads
 * 2. 18 Employees with detailed profiles, salaries, bank accounts & leave balances
 * 3. 4 Core Demo Login Accounts across every role (Admin, HR, Manager, Employee)
 * 4. Official 2026 Holiday Calendar
 * 5. Complete 1-Month Attendance (~378 records) with distinct realistic employee punch profiles
 * 6. Leave Requests (Approved, Pending, Rejected)
 * 7. Previous Month Payroll Payslips calculated from attendance & salary structures
 * 8. Performance Reviews with measurable competencies and goals
 * 9. Company Announcements & Notices
 *
 * Run with: npm run seed
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

// Random & Helper Utilities
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function pseudoRandom(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

// 1. Departments Definition
const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG', description: 'Product architecture, software engineering, and platform reliability' },
  { name: 'Human Resources', code: 'HR', description: 'Talent acquisition, employee experience, and HR operations' },
  { name: 'Sales', code: 'SAL', description: 'Enterprise accounts, business development, and revenue operations' },
  { name: 'Marketing', code: 'MKT', description: 'Product marketing, brand strategy, demand generation, and growth' },
  { name: 'Finance', code: 'FIN', description: 'Corporate accounting, financial planning, compliance, and payroll' },
  { name: 'Operations', code: 'OPS', description: 'IT infrastructure, workspace logistics, and physical facilities' },
];

// 2. Employees Definition: [firstName, lastName, gender, deptCode, designation, isLead, monthlyBasic]
const PEOPLE = [
  ['Aarav', 'Sharma', 'male', 'ENG', 'Engineering Manager', true, 95000],
  ['Isha', 'Verma', 'female', 'ENG', 'Senior Software Engineer', false, 72000],
  ['Rohan', 'Mehta', 'male', 'ENG', 'Software Engineer', false, 55000],
  ['Neha', 'Gupta', 'female', 'ENG', 'Frontend Engineer', false, 52000],
  ['Karan', 'Singh', 'male', 'ENG', 'DevOps Engineer', false, 60000],
  ['Priya', 'Nair', 'female', 'HR', 'HR Manager', true, 78000],
  ['Anjali', 'Rao', 'female', 'HR', 'HR Executive', false, 42000],
  ['Vikram', 'Malhotra', 'male', 'SAL', 'Sales Head', true, 88000],
  ['Sneha', 'Kapoor', 'female', 'SAL', 'Account Executive', false, 48000],
  ['Arjun', 'Reddy', 'male', 'SAL', 'Sales Associate', false, 38000],
  ['Meera', 'Iyer', 'female', 'MKT', 'Marketing Lead', true, 74000],
  ['Rahul', 'Joshi', 'male', 'MKT', 'Content Strategist', false, 45000],
  ['Divya', 'Menon', 'female', 'MKT', 'Digital Marketer', false, 42000],
  ['Sanjay', 'Patel', 'male', 'FIN', 'Finance Manager', true, 80000],
  ['Pooja', 'Desai', 'female', 'FIN', 'Senior Accountant', false, 46000],
  ['Amit', 'Kumar', 'male', 'OPS', 'Operations Manager', true, 65000],
  ['Ritu', 'Chauhan', 'female', 'OPS', 'IT Support Specialist', false, 38000],
  ['Farhan', 'Khan', 'male', 'OPS', 'Facilities Coordinator', false, 32000],
];

// Individual attendance profiles for realistic variation
const EMPLOYEE_ATTENDANCE_PROFILES = {
  'Aarav Sharma': { baseInH: 9, baseInM: 10, baseOutH: 19, baseOutM: 0, lateChance: 0.05, halfDayChance: 0.02, leaveChance: 0.03 },
  'Priya Nair': { baseInH: 8, baseInM: 58, baseOutH: 18, baseOutM: 20, lateChance: 0.02, halfDayChance: 0.02, leaveChance: 0.03 },
  'Vikram Malhotra': { baseInH: 9, baseInM: 5, baseOutH: 19, baseOutM: 25, lateChance: 0.08, halfDayChance: 0.03, leaveChance: 0.04 },
  'Meera Iyer': { baseInH: 9, baseInM: 15, baseOutH: 18, baseOutM: 40, lateChance: 0.06, halfDayChance: 0.02, leaveChance: 0.03 },
  'Sanjay Patel': { baseInH: 8, baseInM: 55, baseOutH: 18, baseOutM: 15, lateChance: 0.01, halfDayChance: 0.01, leaveChance: 0.02 },
  'Amit Kumar': { baseInH: 8, baseInM: 45, baseOutH: 18, baseOutM: 5, lateChance: 0.01, halfDayChance: 0.02, leaveChance: 0.02 },
  'Isha Verma': { baseInH: 9, baseInM: 18, baseOutH: 18, baseOutM: 50, lateChance: 0.08, halfDayChance: 0.03, leaveChance: 0.04 },
  'Rohan Mehta': { baseInH: 9, baseInM: 25, baseOutH: 19, baseOutM: 10, lateChance: 0.22, halfDayChance: 0.04, leaveChance: 0.05 },
  'Neha Gupta': { baseInH: 9, baseInM: 8, baseOutH: 18, baseOutM: 15, lateChance: 0.05, halfDayChance: 0.02, leaveChance: 0.06 },
  'Karan Singh': { baseInH: 9, baseInM: 12, baseOutH: 18, baseOutM: 45, lateChance: 0.12, halfDayChance: 0.08, leaveChance: 0.04 },
  'Anjali Rao': { baseInH: 9, baseInM: 2, baseOutH: 18, baseOutM: 10, lateChance: 0.02, halfDayChance: 0.01, leaveChance: 0.03 },
  'Sneha Kapoor': { baseInH: 9, baseInM: 22, baseOutH: 19, baseOutM: 15, lateChance: 0.20, halfDayChance: 0.03, leaveChance: 0.05 },
  'Arjun Reddy': { baseInH: 9, baseInM: 16, baseOutH: 18, baseOutM: 35, lateChance: 0.07, halfDayChance: 0.02, leaveChance: 0.04 },
  'Rahul Joshi': { baseInH: 9, baseInM: 20, baseOutH: 18, baseOutM: 25, lateChance: 0.06, halfDayChance: 0.02, leaveChance: 0.05 },
  'Divya Menon': { baseInH: 9, baseInM: 12, baseOutH: 18, baseOutM: 20, lateChance: 0.07, halfDayChance: 0.02, leaveChance: 0.06 },
  'Pooja Desai': { baseInH: 8, baseInM: 52, baseOutH: 18, baseOutM: 8, lateChance: 0.01, halfDayChance: 0.01, leaveChance: 0.03 },
  'Ritu Chauhan': { baseInH: 9, baseInM: 5, baseOutH: 18, baseOutM: 18, lateChance: 0.04, halfDayChance: 0.02, leaveChance: 0.04 },
  'Farhan Khan': { baseInH: 8, baseInM: 48, baseOutH: 18, baseOutM: 2, lateChance: 0.03, halfDayChance: 0.02, leaveChance: 0.05 },
};

function buildSalary(basic) {
  const hra = Math.round(basic * 0.4);
  const allowances = Math.round(basic * 0.15);
  const pf = Math.round(basic * 0.12);
  const professionalTax = 200;
  return { basic, hra, allowances, pf, professionalTax };
}

async function clearDatabase() {
  console.log('[1/9] Cleaning database collections...');
  await Promise.all([
    Department.deleteMany({}),
    Employee.deleteMany({}),
    User.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Payroll.deleteMany({}),
    Performance.deleteMany({}),
    Announcement.deleteMany({}),
    Holiday.deleteMany({}),
  ]);
}

async function runSeed() {
  await connectDB();
  console.log('\n========================================================');
  console.log('   EMS & Payroll — Unified Master Database Seeder');
  console.log('========================================================\n');

  await clearDatabase();

  // 1. Departments
  console.log('[2/9] Seeding Departments...');
  const deptDocs = await Department.insertMany(DEPARTMENTS);
  const deptByCode = Object.fromEntries(deptDocs.map((d) => [d.code, d]));
  console.log(`      ✓ ${deptDocs.length} departments created`);

  // 2. Employees
  console.log('[3/9] Seeding Employees...');
  const sortedPeople = [...PEOPLE].sort((a, b) => Number(b[5]) - Number(a[5]));
  const leadByDept = {};
  const employees = [];
  let seq = 0;

  for (const [firstName, lastName, gender, code, designation, isLead, basic] of sortedPeople) {
    seq += 1;
    const joinYearsAgo = rand(1, 3);
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
      employmentType: 'full-time',
      status: 'active',
      dateOfJoining,
      salary: buildSalary(basic),
      leaveBalance: new Map(Object.entries(DEFAULT_LEAVE_BALANCE)),
      emergencyContact: {
        name: `${lastName} Family`,
        phone: `+91 9${rand(100000000, 999999999)}`,
        relation: 'Spouse',
      },
      bank: {
        accountName: `${firstName} ${lastName}`,
        accountNumber: String(rand(1000000000, 9999999999)),
        bankName: 'HDFC Bank',
        ifsc: 'HDFC0001234',
      },
    });

    if (isLead) leadByDept[code] = emp;
    employees.push({ emp, isLead, code });
  }

  // Assign department heads
  for (const code of Object.keys(leadByDept)) {
    await Department.findByIdAndUpdate(deptByCode[code]._id, { head: leadByDept[code]._id });
  }
  console.log(`      ✓ ${employees.length} employees created with managers & department heads`);

  // 3. Login Accounts
  console.log('[4/9] Seeding Core Demo Login Accounts...');
  const adminUser = await User.create({
    name: env.seedAdmin.name || 'Mohd Zaid (Admin)',
    email: env.seedAdmin.email || 'zaidm1323@gmail.com',
    password: env.seedAdmin.password || 'Zaid@9999201255',
    role: ROLES.ADMIN,
    isVerified: true,
    status: 'ACTIVE',
  });

  const accounts = [
    { find: (e) => e.emp.designation === 'HR Manager', role: ROLES.HR },
    { find: (e) => e.emp.designation === 'Engineering Manager', role: ROLES.MANAGER },
    { find: (e) => e.emp.designation === 'Software Engineer', role: ROLES.EMPLOYEE },
  ];

  for (const acc of accounts) {
    const match = employees.find(acc.find);
    if (!match) continue;
    const user = await User.create({
      name: match.emp.fullName,
      email: match.emp.email,
      password: 'Password@123',
      role: acc.role,
      employee: match.emp._id,
      isVerified: true,
      status: 'ACTIVE',
    });
    match.emp.user = user._id;
    await match.emp.save();
  }
  console.log(`      ✓ 4 core login accounts configured (Admin, HR, Manager, Employee)`);

  // 4. Official 2026 Holiday Calendar
  console.log('[5/9] Seeding 2026 Holiday Calendar...');
  const year2026 = 2026;
  const holidaysList = [
    { name: 'Republic Day', date: new Date(year2026, 0, 26), type: 'public', description: 'National Holiday' },
    { name: 'Holi', date: new Date(year2026, 2, 10), type: 'public', description: 'Festival of Colors' },
    { name: 'Eid-ul-Fitr', date: new Date(year2026, 2, 20), type: 'public', description: 'Religious Festival' },
    { name: 'Independence Day', date: new Date(year2026, 7, 15), type: 'public', description: 'National Holiday' },
    { name: 'Mahatma Gandhi Jayanti', date: new Date(year2026, 9, 2), type: 'public', description: 'National Holiday' },
    { name: 'Dussehra', date: new Date(year2026, 9, 20), type: 'public', description: 'Vijayadashami' },
    { name: 'Diwali', date: new Date(year2026, 10, 8), type: 'public', description: 'Festival of Lights' },
    { name: 'Christmas', date: new Date(year2026, 11, 25), type: 'public', description: 'Christmas Day' },
  ];
  await Holiday.insertMany(holidaysList);
  console.log(`      ✓ ${holidaysList.length} official holidays created`);

  // 5. 1-Month Realistic Attendance (Past 30 Days)
  console.log('[6/9] Seeding 1-Month Full Attendance (Past 30 Days)...');
  const endDate = new Date(2026, 9, 11); // 11 Oct 2026
  const startDate = new Date(2026, 8, 11); // 11 Sep 2026
  const HOLIDAY_KEYS = new Set(['2026-10-02']); // Gandhi Jayanti

  const attendanceOps = [];
  const statusStats = { present: 0, late: 0, 'half-day': 0, 'on-leave': 0 };

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dayKey = cursor.toISOString().split('T')[0];
    const isWknd = isWeekend(cursor);
    const isHol = HOLIDAY_KEYS.has(dayKey);

    if (!isWknd && !isHol) {
      for (const { emp } of employees) {
        const empName = `${emp.firstName} ${emp.lastName}`;
        const profile = EMPLOYEE_ATTENDANCE_PROFILES[empName] || {
          baseInH: 9, baseInM: 10, baseOutH: 18, baseOutM: 20,
          lateChance: 0.08, halfDayChance: 0.03, leaveChance: 0.04
        };

        const seedKey = `${emp.employeeId}-${dayKey}`;
        const r1 = pseudoRandom(`${seedKey}-status`);
        const r2 = pseudoRandom(`${seedKey}-in`);
        const r3 = pseudoRandom(`${seedKey}-out`);

        let status = 'present';
        let checkIn = null;
        let checkOut = null;
        let workHours = 0;

        if (r1 < profile.leaveChance) {
          status = 'on-leave';
          checkIn = null;
          checkOut = null;
          workHours = 0;
        } else if (r1 < profile.leaveChance + profile.halfDayChance) {
          status = 'half-day';
          const inJitter = Math.floor(r2 * 20) - 10;
          checkIn = new Date(cursor);
          checkIn.setHours(profile.baseInH, Math.max(0, Math.min(59, profile.baseInM + inJitter)), Math.floor(r1 * 50), 0);

          checkOut = new Date(cursor);
          checkOut.setHours(13, 30 + Math.floor(r3 * 30), Math.floor(r2 * 50), 0);
          workHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
        } else if (r1 < profile.leaveChance + profile.halfDayChance + profile.lateChance) {
          status = 'late';
          const lateMins = 35 + Math.floor(r2 * 45); // 09:35 to 10:20 AM
          checkIn = new Date(cursor);
          checkIn.setHours(9, lateMins, Math.floor(r1 * 55), 0);

          const outJitter = Math.floor(r3 * 40) - 10;
          checkOut = new Date(cursor);
          checkOut.setHours(profile.baseOutH, Math.max(0, Math.min(59, profile.baseOutM + outJitter)), Math.floor(r2 * 50), 0);
          workHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
        } else {
          status = 'present';
          const inJitter = Math.floor(r2 * 24) - 12;
          checkIn = new Date(cursor);
          checkIn.setHours(profile.baseInH, Math.max(0, Math.min(59, profile.baseInM + inJitter)), Math.floor(r1 * 55), 0);

          const outJitter = Math.floor(r3 * 36) - 15;
          checkOut = new Date(cursor);
          checkOut.setHours(profile.baseOutH, Math.max(0, Math.min(59, profile.baseOutM + outJitter)), Math.floor(r2 * 55), 0);
          workHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
        }

        statusStats[status] = (statusStats[status] || 0) + 1;

        attendanceOps.push({
          employee: emp._id,
          date: startOfDay(cursor),
          checkIn,
          checkOut,
          status,
          workHours,
          createdAt: checkIn || cursor,
          updatedAt: checkOut || cursor,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  await Attendance.insertMany(attendanceOps);
  console.log(`      ✓ ${attendanceOps.length} attendance records created across 30 days`);
  console.log(`        (Present: ${statusStats.present}, Late: ${statusStats.late}, Half-Day: ${statusStats['half-day']}, On-Leave: ${statusStats['on-leave']})`);

  // 6. Leave Requests
  console.log('[7/9] Seeding Leave Requests...');
  const leaveTypes = ['casual', 'sick', 'earned'];
  const leaveReasons = [
    'Family function in hometown',
    'Viral fever and doctor consultation',
    'Personal domestic work',
    'Medical appointment for parents',
    'Vacation travel with family',
    'Urgent legal documentation work',
  ];
  let leaveCount = 0;

  for (const { emp } of employees) {
    if (Math.random() > 0.6) continue;
    const type = pick(leaveTypes);
    const start = new Date(2026, 9, rand(1, 24));
    const end = new Date(start);
    end.setDate(end.getDate() + rand(0, 2));
    const days = Math.max(1, Math.round((startOfDay(end) - startOfDay(start)) / 86400000) + 1);
    const status = pick(['approved', 'approved', 'pending', 'rejected']);

    await Leave.create({
      employee: emp._id,
      type,
      startDate: startOfDay(start),
      endDate: startOfDay(end),
      days,
      reason: pick(leaveReasons),
      status,
      reviewedBy: status === 'pending' ? null : adminUser._id,
      reviewedAt: status === 'pending' ? null : new Date(),
      reviewNote: status === 'approved' ? 'Approved by HR' : status === 'rejected' ? 'Team bandwidth constraint' : '',
    });

    if (status === 'approved' && type !== 'unpaid') {
      const bal = emp.leaveBalance.get(type) ?? 0;
      emp.leaveBalance.set(type, Math.max(0, bal - days));
      await emp.save();
    }
    leaveCount += 1;
  }
  console.log(`      ✓ ${leaveCount} leave requests created with balance adjustments`);

  // 7. Payroll (Previous Month - September 2026)
  console.log('[8/9] Seeding Monthly Payroll Payslips...');
  const payrollDocs = [];
  for (const { emp } of employees) {
    const payslip = await computePayslip(emp, { month: 9, year: 2026 });
    payrollDocs.push({
      ...payslip,
      employee: emp._id,
      status: 'paid',
      paidAt: new Date(2026, 9, 1),
      generatedBy: adminUser._id,
      note: 'Processed via automated monthly payroll cycle',
    });
  }
  await Payroll.insertMany(payrollDocs);
  console.log(`      ✓ ${payrollDocs.length} payslips generated for September 2026`);

  // 8. Performance Reviews & Announcements
  console.log('[9/9] Seeding Performance Reviews & Notices...');
  const period = 'Q3 2026';
  let reviewCount = 0;
  for (const { emp, isLead, code } of employees) {
    if (isLead) continue;
    const r = () => rand(3, 5);
    await Performance.create({
      employee: emp._id,
      reviewer: leadByDept[code]?._id || null,
      period,
      ratings: {
        productivity: r(),
        quality: r(),
        communication: r(),
        teamwork: r(),
        leadership: rand(2, 4),
      },
      goals: [
        { title: 'Deliver Q3 milestone projects within SLA', weight: 40, rating: r(), comment: 'Consistently achieved target dates' },
        { title: 'Drive cross-departmental collaboration', weight: 30, rating: r(), comment: 'Actively contributed in team syncs' },
        { title: 'Upskilling & tooling enhancements', weight: 30, rating: r(), comment: 'Completed advanced certification' },
      ],
      strengths: 'Strong ownership, technical excellence, and dependable execution.',
      improvements: 'Can lead cross-functional architecture reviews more independently.',
      reviewerComment: 'Solid performer throughout Q3. Recommended for appraisal.',
      status: 'acknowledged',
    });
    reviewCount += 1;
  }
  console.log(`      ✓ ${reviewCount} Q3 performance reviews completed`);

  const notices = [
    {
      title: 'Annual Enterprise Strategy & Town Hall 2026',
      body: 'All team members are invited to attend the annual hybrid Town Hall meeting on Friday at 4:00 PM. Leadership will review Q3 achievements and outline the Q4 roadmap.',
      category: 'event',
      pinned: true,
      author: adminUser._id,
    },
    {
      title: 'Updated Hybrid Shift & Attendance Punch Policy',
      body: 'Please ensure attendance check-in punches are recorded before 09:30 AM. Late check-ins beyond 09:30 AM will automatically be logged as late arrival.',
      category: 'policy',
      pinned: true,
      author: adminUser._id,
    },
    {
      title: 'Upcoming National Holiday — Mahatma Gandhi Jayanti',
      body: 'Offices will remain closed on Friday, 2nd October in observance of Mahatma Gandhi Jayanti. Enjoy the extended weekend!',
      category: 'holiday',
      pinned: false,
      author: adminUser._id,
    },
    {
      title: 'Q3 Appraisal & Bonus Cycle Notification',
      body: 'September payroll and performance incentives have been disbursed. Payslips are now accessible under the Payroll & Slips portal.',
      category: 'general',
      pinned: false,
      author: adminUser._id,
    },
  ];
  await Announcement.insertMany(notices);
  console.log(`      ✓ ${notices.length} enterprise announcements published`);

  console.log('\n========================================================');
  console.log('   SUCCESS! FULL SEED DATA LOADED ACCURATELY');
  console.log('========================================================');
  console.log('Demo Credentials:');
  console.log('   • Admin:      admin@ems.dev       / Admin@12345');
  console.log('   • HR Manager: priya.nair@ems.dev  / Password@123');
  console.log('   • Manager:    aarav.sharma@ems.dev/ Password@123');
  console.log('   • Employee:   rohan.mehta@ems.dev / Password@123');
  console.log('========================================================\n');

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error('[FATAL] Database seeding failed:', err);
  process.exit(1);
});
