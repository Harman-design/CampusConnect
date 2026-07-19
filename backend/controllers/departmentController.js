const Department = require('../models/Department');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @route GET /api/departments
exports.getDepartments = catchAsync(async (req, res, next) => {
  const departments = await Department.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: departments });
});

// @route POST /api/departments
exports.createDepartment = catchAsync(async (req, res, next) => {
  const { name, code } = req.body;
  if (!name || !code) {
    return next(new AppError('Name and code are required.', 400));
  }
  const department = await Department.create({ name, code });
  res.status(201).json({ success: true, data: department });
});

// @route PUT /api/departments/:id
exports.updateDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!department) return next(new AppError('Department not found.', 404));
  res.status(200).json({ success: true, data: department });
});

// @route DELETE /api/departments/:id
exports.deleteDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) return next(new AppError('Department not found.', 404));
  res.status(200).json({ success: true, message: 'Department deleted successfully.' });
});
