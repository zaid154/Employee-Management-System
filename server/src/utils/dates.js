// Small date helpers used across attendance, leave, and payroll logic.

/** Strip the time portion so a date represents a calendar day. */
export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

/** Inclusive count of calendar days between two dates. */
export const daysBetween = (start, end) => {
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  return Math.floor((b - a) / 86400000) + 1;
};

/** Count working days (excludes weekends) between two dates, inclusive. */
export const workingDaysBetween = (start, end, holidays = []) => {
  const holidaySet = new Set(holidays.map((h) => startOfDay(h).getTime()));
  let count = 0;
  const cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor <= last) {
    if (!isWeekend(cursor) && !holidaySet.has(cursor.getTime())) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

/** Number of days in a given month (month is 1-12). */
export const daysInMonth = (month, year) => new Date(year, month, 0).getDate();

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
