import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Announcement } from '../models/Announcement.js';

/** GET /api/announcements — visible to the caller's role. */
export const listAnnouncements = asyncHandler(async (req, res) => {
  const filter = { $or: [{ audience: { $size: 0 } }, { audience: req.user.role }] };
  const items = await Announcement.find(filter)
    .populate('author', 'name')
    .sort({ pinned: -1, createdAt: -1 })
    .lean();
  res.json({ success: true, data: items });
});

/** POST /api/announcements (HR / admin). */
export const createAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.create({ ...req.body, author: req.user._id });
  res.status(201).json({ success: true, data: item });
});

/** PATCH /api/announcements/:id */
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) throw ApiError.notFound('Announcement not found');
  res.json({ success: true, data: item });
});

/** DELETE /api/announcements/:id */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const item = await Announcement.findByIdAndDelete(req.params.id);
  if (!item) throw ApiError.notFound('Announcement not found');
  res.json({ success: true, message: 'Announcement deleted' });
});
