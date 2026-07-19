const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Helper for audit logging
const logAction = async (req, action, details = '') => {
  try {
    await AuditLog.create({
      action,
      details,
      performedBy: req.user._id,
      ipAddress: req.ip || '',
    });
  } catch (error) {
    console.error('[Audit Log Failed]', error);
  }
};

// @route GET /api/admin/users
// Get all users with filters (role, search)
exports.getUsers = catchAsync(async (req, res, next) => {
  const { role, search } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { registerNumber: new RegExp(search, 'i') },
    ];
  }

  const users = await User.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: users,
  });
});

// @route GET /api/admin/users/:id
// Get user by ID
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @route PUT /api/admin/users/:id
// Update user details (extended profile: hostel, fees, academic details)
exports.updateUser = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    role,
    department,
    semester,
    registerNumber,
    cgpa,
    backlogs,
    graduationYear,
    isActive,
    hostelDetails,
    feeDetails,
    achievements,
    certificates,
  } = req.body;

  let user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;
  if (role) updateFields.role = role;
  if (department !== undefined) updateFields.department = department;
  if (semester !== undefined) updateFields.semester = semester ? Number(semester) : null;
  if (registerNumber !== undefined) updateFields.registerNumber = registerNumber;
  if (cgpa !== undefined) updateFields.cgpa = cgpa ? Number(cgpa) : null;
  if (backlogs !== undefined) updateFields.backlogs = Number(backlogs);
  if (graduationYear !== undefined) updateFields.graduationYear = graduationYear ? Number(graduationYear) : null;
  if (isActive !== undefined) updateFields.isActive = isActive;
  if (hostelDetails) updateFields.hostelDetails = hostelDetails;
  if (feeDetails) updateFields.feeDetails = feeDetails;
  if (achievements) updateFields.achievements = achievements;
  if (certificates) updateFields.certificates = certificates;

  user = await User.findByIdAndUpdate(req.params.id, updateFields, {
    new: true,
    runValidators: true,
  });

  await logAction(req, 'UPDATE_USER', `Updated details for user ID ${user._id} (${user.email})`);

  res.status(200).json({
    success: true,
    message: 'User updated successfully.',
    data: user,
  });
});

// @route DELETE /api/admin/users/:id
// Delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  await logAction(req, 'DELETE_USER', `Deleted user ID ${user._id} (${user.email})`);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully.',
  });
});

// @route GET /api/admin/audit-logs
// Get Audit Logs
exports.getAuditLogs = catchAsync(async (req, res, next) => {
  const logs = await AuditLog.find()
    .populate('performedBy', 'name email role')
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    data: logs,
  });
});

// @route GET /api/admin/settings
// Get all system settings
exports.getSettings = catchAsync(async (req, res, next) => {
  const settings = await SystemSetting.find().sort({ key: 1 });
  res.status(200).json({
    success: true,
    data: settings,
  });
});

// @route POST /api/admin/settings
// Create/Update system setting
exports.updateSetting = catchAsync(async (req, res, next) => {
  const { key, value, description } = req.body;

  if (!key) {
    return next(new AppError('Setting key is required.', 400));
  }

  const setting = await SystemSetting.findOneAndUpdate(
    { key },
    { value, description },
    { new: true, upsert: true }
  );

  await logAction(req, 'UPDATE_SETTING', `Updated system setting key '${key}' to '${JSON.stringify(value)}'`);

  res.status(200).json({
    success: true,
    message: 'System setting updated successfully.',
    data: setting,
  });
});
