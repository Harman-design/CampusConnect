const TimetableSlot = require('../models/TimetableSlot');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @route GET /api/timetable
// Get timetable slots (Student/Faculty/Admin)
exports.getTimetable = catchAsync(async (req, res, next) => {
  const { role, department, semester } = req.user;
  let query = {};

  if (role === 'student') {
    if (!department || !semester) {
      return next(new AppError('Student profile must have department and semester set to fetch timetable.', 400));
    }
    query = { department, semester: Number(semester) };
  } else if (role === 'faculty') {
    query = { faculty: req.user._id };
  } else if (role === 'admin') {
    const { dept, sem } = req.query;
    if (dept) query.department = dept;
    if (sem) query.semester = Number(sem);
  }

  const slots = await TimetableSlot.find(query)
    .populate('faculty', 'name email')
    .sort({ dayOfWeek: 1, startTime: 1 });

  res.status(200).json({
    success: true,
    data: slots,
  });
});

// @route POST /api/timetable
// Create timetable slot (Admin only)
exports.createSlot = catchAsync(async (req, res, next) => {
  const { department, semester, dayOfWeek, startTime, endTime, subject, faculty, classroom } = req.body;

  if (!department || !semester || !dayOfWeek || !startTime || !endTime || !subject || !faculty) {
    return next(new AppError('Please provide all required fields.', 400));
  }

  const slot = await TimetableSlot.create({
    department,
    semester: Number(semester),
    dayOfWeek,
    startTime,
    endTime,
    subject,
    faculty,
    classroom,
  });

  res.status(201).json({
    success: true,
    message: 'Timetable slot created successfully.',
    data: slot,
  });
});

// @route PUT /api/timetable/:id
// Update timetable slot (Admin only)
exports.updateSlot = catchAsync(async (req, res, next) => {
  const slot = await TimetableSlot.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!slot) {
    return next(new AppError('Timetable slot not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Timetable slot updated successfully.',
    data: slot,
  });
});

// @route DELETE /api/timetable/:id
// Delete timetable slot (Admin only)
exports.deleteSlot = catchAsync(async (req, res, next) => {
  const slot = await TimetableSlot.findByIdAndDelete(req.params.id);

  if (!slot) {
    return next(new AppError('Timetable slot not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Timetable slot deleted successfully.',
  });
});
