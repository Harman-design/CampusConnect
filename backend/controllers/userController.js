const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

const ALLOWED_FIELDS = ['name', 'department', 'semester', 'registerNumber', 'cgpa', 'backlogs', 'graduationYear', 'resumeUrl', 'hostelDetails', 'feeDetails', 'achievements', 'certificates'];

// @route PATCH /api/users/profile — any authenticated user
exports.updateMyProfile = catchAsync(async (req, res) => {
  const updates = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

  res.status(200).json({ success: true, message: 'Profile updated successfully.', data: { user: user.toSafeJSON() } });
});

// @route GET /api/users/students — Faculty & Admin
exports.getStudentsForFaculty = catchAsync(async (req, res) => {
  const { department, semester } = req.query;
  const filter = { role: 'student' };
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);

  const students = await User.find(filter).sort({ name: 1 });
  res.status(200).json({ success: true, data: students });
});
