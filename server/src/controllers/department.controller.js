import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { Department } from '../models/Department.js';
import { Employee } from '../models/Employee.js';

/** GET /api/departments */
export const listDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find()
    .populate('head', 'firstName lastName employeeId avatar')
    .sort('name')
    .lean();

  // Attach a live headcount per department.
  const counts = await Employee.aggregate([
    { $match: { status: { $nin: ['resigned', 'terminated'] } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  res.json({
    success: true,
    data: departments.map((d) => ({ ...d, headcount: countMap[String(d._id)] || 0 })),
  });
});

/** POST /api/departments */
export const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json({ success: true, data: department });
});

/** PATCH /api/departments/:id */
export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) throw ApiError.notFound('Department not found');
  res.json({ success: true, data: department });
});

/** DELETE /api/departments/:id */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const inUse = await Employee.countDocuments({ department: req.params.id });
  if (inUse > 0) {
    throw ApiError.badRequest(`Cannot delete: ${inUse} employee(s) still belong to this department`);
  }
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) throw ApiError.notFound('Department not found');
  res.json({ success: true, message: 'Department deleted' });
});
