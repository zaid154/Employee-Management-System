import mongoose from 'mongoose';
import { LEAVE_TYPES, LEAVE_STATUS } from '../utils/constants.js';

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    type: { type: String, enum: LEAVE_TYPES, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    // Inclusive working-day count, computed on create.
    days: { type: Number, required: true, min: 0.5 },
    halfDay: { type: Boolean, default: false },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: LEAVE_STATUS, default: 'pending', index: true },

    // Approval trail
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '' },
  },
  { timestamps: true }
);

leaveSchema.set('toJSON', { virtuals: true });

export const Leave = mongoose.model('Leave', leaveSchema);
