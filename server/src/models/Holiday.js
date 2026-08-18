import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['public', 'optional', 'company'], default: 'public' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 });
holidaySchema.set('toJSON', { virtuals: true });

export const Holiday = mongoose.model('Holiday', holidaySchema);
