/**
 * Standalone Seed Script: 1 Month of Realistic Attendance for All Employees
 * Generates natural, varied daily check-in and check-out records for every employee
 * across the past 30 days without wiping existing user accounts or active sessions.
 *
 * Run with: npm run seed:month  (or: node src/seed_month.js)
 */
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { Employee } from './models/Employee.js';
import { Attendance } from './models/Attendance.js';
import { startOfDay, isWeekend } from './utils/dates.js';

// Deterministic PRNG helper based on string hash for realistic varied days
function pseudoRandom(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

// Custom work habit profile for each employee
const EMPLOYEE_PROFILES = {
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

async function seedMonthAttendance() {
  console.log('[INFO] Connecting to MongoDB...');
  await mongoose.connect(env.mongoUri);

  const employees = await Employee.find({ status: 'active' }).sort('employeeId').lean();
  if (!employees.length) {
    console.error('[ERROR] No active employees found in database. Please run initial seed first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`[INFO] Found ${employees.length} active employees. Generating 1-month realistic attendance...`);

  // Target window: past 30 days up to today (11 Oct 2026)
  const endDate = new Date(2026, 9, 11); // 11 Oct 2026
  const startDate = new Date(2026, 8, 11); // 11 Sep 2026 (30 calendar days)

  // Public holidays in India during this month
  const HOLIDAYS = new Set([
    '2026-10-02', // Mahatma Gandhi Jayanti
  ]);

  const attendanceRecords = [];
  const statusCounts = { present: 0, late: 0, 'half-day': 0, 'on-leave': 0 };

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dayKey = cursor.toISOString().split('T')[0];
    const isWknd = isWeekend(cursor);
    const isHol = HOLIDAYS.has(dayKey);

    // Skip weekends and national public holidays
    if (!isWknd && !isHol) {
      for (const emp of employees) {
        const empName = `${emp.firstName} ${emp.lastName}`;
        const profile = EMPLOYEE_PROFILES[empName] || {
          baseInH: 9, baseInM: 10, baseOutH: 18, baseOutM: 20,
          lateChance: 0.08, halfDayChance: 0.03, leaveChance: 0.04
        };

        const seedKey = `${emp.employeeId}-${dayKey}`;
        const r1 = pseudoRandom(`${seedKey}-status`);
        const r2 = pseudoRandom(`${seedKey}-jitterIn`);
        const r3 = pseudoRandom(`${seedKey}-jitterOut`);

        let status = 'present';
        let checkIn = null;
        let checkOut = null;
        let workHours = 0;

        if (r1 < profile.leaveChance) {
          // On Leave
          status = 'on-leave';
          checkIn = null;
          checkOut = null;
          workHours = 0;
        } else if (r1 < profile.leaveChance + profile.halfDayChance) {
          // Half Day
          status = 'half-day';
          const inMinJitter = Math.floor(r2 * 20) - 10;
          checkIn = new Date(cursor);
          checkIn.setHours(profile.baseInH, Math.max(0, Math.min(59, profile.baseInM + inMinJitter)), Math.floor(r1 * 50), 0);

          checkOut = new Date(cursor);
          checkOut.setHours(13, 30 + Math.floor(r3 * 30), Math.floor(r2 * 50), 0);
          workHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
        } else if (r1 < profile.leaveChance + profile.halfDayChance + profile.lateChance) {
          // Late Arrival (after 09:30 AM)
          status = 'late';
          const lateMins = 35 + Math.floor(r2 * 45); // 09:35 to 10:20 AM
          checkIn = new Date(cursor);
          checkIn.setHours(9, lateMins, Math.floor(r1 * 55), 0);

          const outJitter = Math.floor(r3 * 40) - 10;
          checkOut = new Date(cursor);
          checkOut.setHours(profile.baseOutH, Math.max(0, Math.min(59, profile.baseOutM + outJitter)), Math.floor(r2 * 50), 0);
          workHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
        } else {
          // Regular Present (between 08:45 AM and 09:28 AM)
          status = 'present';
          const inJitter = Math.floor(r2 * 24) - 12; // +/- 12 mins around base
          checkIn = new Date(cursor);
          checkIn.setHours(profile.baseInH, Math.max(0, Math.min(59, profile.baseInM + inJitter)), Math.floor(r1 * 55), 0);

          const outJitter = Math.floor(r3 * 36) - 15; // +/- 15 mins around base
          checkOut = new Date(cursor);
          checkOut.setHours(profile.baseOutH, Math.max(0, Math.min(59, profile.baseOutM + outJitter)), Math.floor(r2 * 55), 0);
          workHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
        }

        statusCounts[status] = (statusCounts[status] || 0) + 1;

        attendanceRecords.push({
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

  // Safely replace only the attendances collection
  console.log('[INFO] Replacing old attendance collection with 1-month realistic dataset...');
  await Attendance.deleteMany({});
  await Attendance.insertMany(attendanceRecords);

  console.log('\n========================================================');
  console.log('   SUCCESS! 1-MONTH ATTENDANCE SEEDED SUCCESSFULLY');
  console.log('========================================================');
  console.log(`Total Records Created: ${attendanceRecords.length}`);
  console.log(`Employees Covered:     ${employees.length}`);
  console.log(`Date Range:            11 Sep 2026 to 11 Oct 2026 (Working Days)`);
  console.log('Breakdown by Status:');
  console.log(`   - Present:   ${statusCounts.present}`);
  console.log(`   - Late:      ${statusCounts.late}`);
  console.log(`   - Half-Day:  ${statusCounts['half-day']}`);
  console.log(`   - On Leave:  ${statusCounts['on-leave']}`);
  console.log('========================================================\n');

  await mongoose.disconnect();
}

seedMonthAttendance().catch((err) => {
  console.error('[FATAL] Failed to seed month attendance:', err);
  process.exit(1);
});
