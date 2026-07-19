const Subject = require('../models/Subject');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @route GET /api/subjects
exports.getSubjects = catchAsync(async (req, res, next) => {
  const { department, semester } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);

  const subjects = await Subject.find(filter).sort({ name: 1 });
  res.status(200).json({ success: true, data: subjects });
});

// @route POST /api/subjects
exports.createSubject = catchAsync(async (req, res, next) => {
  const { name, code, department, semester, credits } = req.body;
  if (!name || !code || !department || !semester) {
    return next(new AppError('Name, code, department, and semester are required.', 400));
  }
  const subject = await Subject.create({ name, code, department, semester, credits });
  res.status(201).json({ success: true, data: subject });
});

// @route PUT /api/subjects/:id
exports.updateSubject = catchAsync(async (req, res, next) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!subject) return next(new AppError('Subject not found.', 404));
  res.status(200).json({ success: true, data: subject });
});

// @route DELETE /api/subjects/:id
exports.deleteSubject = catchAsync(async (req, res, next) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return next(new AppError('Subject not found.', 404));
  res.status(200).json({ success: true, message: 'Subject deleted successfully.' });
});
