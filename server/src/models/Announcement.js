import mongoose from 'mongoose';
import { ROLE_VALUES } from '../utils/constants.js';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'policy', 'event', 'holiday', 'urgent'],
      default: 'general',
    },
    // Which roles should see it ('all' handled by empty array).
    audience: { type: [String], enum: ROLE_VALUES, default: [] },
    pinned: { type: Boolean, default: false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

announcementSchema.set('toJSON', { virtuals: true });

export const Announcement = mongoose.model('Announcement', announcementSchema);
