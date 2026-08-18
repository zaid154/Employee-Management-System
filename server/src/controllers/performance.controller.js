import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Performance } from '../models/Performance.js';
import { scopeToEmployees, ownEmployeeId, isPrivileged } from '../utils/access.js';

/** GET /api/performance — access-scoped review list. */
export const listReviews = asyncHandler(async (req, res) => {
  const { employee, period, status, page = 1, limit = 15 } = req.query;
  const filter = await scopeToEmployees(req.user);
  if (employee && (isPrivileged(req.user) || req.user.role === 'manager')) filter.employee = employee;
  if (period) filter.period = period;
  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const perPage = Math.min(100, Number(limit));

  const [items, total] = await Promise.all([
    Performance.find(filter)
      .populate('employee', 'firstName lastName employeeId avatar designation')
      .populate('reviewer', 'firstName lastName')
      .sort('-createdAt')
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    Performance.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: perPage, total, pages: Math.ceil(total / perPage) },
  });
});

/** GET /api/performance/:id */
export const getReview = asyncHandler(async (req, res) => {
  const review = await Performance.findById(req.params.id)
    .populate('employee', 'firstName lastName employeeId designation avatar')
    .populate('reviewer', 'firstName lastName');
  if (!review) throw ApiError.notFound('Review not found');

  if (!isPrivileged(req.user) && req.user.role !== 'manager') {
    if (String(review.employee._id) !== String(ownEmployeeId(req.user))) throw ApiError.forbidden();
  }
  res.json({ success: true, data: review });
});

/** POST /api/performance — create a review (HR / manager). */
export const createReview = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.reviewer) payload.reviewer = ownEmployeeId(req.user);
  const review = await Performance.create(payload);
  res.status(201).json({ success: true, data: review });
});

/** PATCH /api/performance/:id — update a review (HR / manager). */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Performance.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');

  Object.assign(review, req.body);
  await review.save(); // triggers overallScore recompute
  res.json({ success: true, data: review });
});

/** PATCH /api/performance/:id/acknowledge — employee signs off on their review. */
export const acknowledgeReview = asyncHandler(async (req, res) => {
  const review = await Performance.findById(req.params.id).populate('employee', '_id');
  if (!review) throw ApiError.notFound('Review not found');
  if (String(review.employee._id) !== String(ownEmployeeId(req.user))) throw ApiError.forbidden();

  review.employeeComment = req.body.employeeComment || review.employeeComment;
  review.status = 'acknowledged';
  await review.save();
  res.json({ success: true, data: review });
});

/** DELETE /api/performance/:id */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Performance.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  res.json({ success: true, message: 'Review deleted' });
});
