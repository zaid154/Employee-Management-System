import mongoose from 'mongoose';
import { REVIEW_STATUS } from '../utils/constants.js';

// A single measurable goal within a review.
const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    weight: { type: Number, default: 0 }, // % weight toward the score
    rating: { type: Number, min: 0, max: 5, default: 0 },
    comment: { type: String, default: '' },
  },
  { _id: false }
);

const performanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    period: { type: String, required: true }, // e.g. "Q1 2026" or "2026-H1"

    // Core competency ratings, each 0-5.
    ratings: {
      productivity: { type: Number, min: 0, max: 5, default: 0 },
      quality: { type: Number, min: 0, max: 5, default: 0 },
      communication: { type: Number, min: 0, max: 5, default: 0 },
      teamwork: { type: Number, min: 0, max: 5, default: 0 },
      leadership: { type: Number, min: 0, max: 5, default: 0 },
    },
    goals: { type: [goalSchema], default: [] },

    // Overall weighted score 0-5, computed on save.
    overallScore: { type: Number, default: 0 },
    strengths: { type: String, default: '' },
    improvements: { type: String, default: '' },
    reviewerComment: { type: String, default: '' },
    employeeComment: { type: String, default: '' },

    status: { type: String, enum: REVIEW_STATUS, default: 'draft', index: true },
  },
  { timestamps: true }
);

// Compute the overall score from competency ratings (average of the five).
performanceSchema.pre('save', function computeScore(next) {
  const r = this.ratings || {};
  const values = [r.productivity, r.quality, r.communication, r.teamwork, r.leadership];
  const total = values.reduce((sum, v) => sum + (v || 0), 0);
  this.overallScore = Math.round((total / values.length) * 100) / 100;
  next();
});

performanceSchema.set('toJSON', { virtuals: true });

export const Performance = mongoose.model('Performance', performanceSchema);
