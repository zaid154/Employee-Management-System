import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Holiday } from '../models/Holiday.js';

/** GET /api/holidays — optionally filter by year. */
export const listHolidays = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.year) {
    const year = Number(req.query.year);
    filter.date = { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) };
  }
  const items = await Holiday.find(filter).sort('date').lean();
  res.json({ success: true, data: items });
});

/** POST /api/holidays (HR / admin). */
export const createHoliday = asyncHandler(async (req, res) => {
  const item = await Holiday.create(req.body);
  res.status(201).json({ success: true, data: item });
});

/** PATCH /api/holidays/:id */
export const updateHoliday = asyncHandler(async (req, res) => {
  const item = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) throw ApiError.notFound('Holiday not found');
  res.json({ success: true, data: item });
});

/** DELETE /api/holidays/:id */
export const deleteHoliday = asyncHandler(async (req, res) => {
  const item = await Holiday.findByIdAndDelete(req.params.id);
  if (!item) throw ApiError.notFound('Holiday not found');
  res.json({ success: true, message: 'Holiday deleted' });
});
