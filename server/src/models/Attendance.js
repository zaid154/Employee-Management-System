import mongoose from 'mongoose';
import { ATTENDANCE_STATUS } from '../utils/constants.js';

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    // Normalised to midnight (local) so one document == one day per employee.
    date: { type: Date, required: true, index: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    status: { type: String, enum: ATTENDANCE_STATUS, default: 'present' },
    // Hours worked, computed on check-out.
    workHours: { type: Number, default: 0 },
    note: { type: String, default: '' },
    // Who recorded it — useful when HR marks attendance manually.
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// One attendance record per employee per day.
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.set('toJSON', { virtuals: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
