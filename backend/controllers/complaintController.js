const Complaint = require('../models/Complaint');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { notifyUsers } = require('../services/notificationService');

// @route POST /api/complaints — Student
exports.createComplaint = catchAsync(async (req, res) => {
  const complaint = await Complaint.create({ ...req.body, student: req.user._id });

  // Let admins know a new complaint needs attention
  await notifyUsers({
    io: req.app.get('io'),
    target: 'admins',
    type: 'announcement',
    title: 'New complaint filed',
    message: `${req.user.name} filed a complaint: "${complaint.subject}"`,
    link: `/admin/complaints?highlight=${complaint._id}`,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Complaint submitted.', data: { complaint } });
});

// @route GET /api/complaints — Student sees own; Admin sees all (filterable)
exports.getComplaints = catchAsync(async (req, res) => {
  const { status, category } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = req.user.role === 'admin' ? {} : { student: req.user._id };
  if (status) filter.status = status;
  if (category) filter.category = category;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('student', 'name email department')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { complaints, pagination: buildPaginationMeta(total, page, limit) } });
});

// @route GET /api/complaints/:id
exports.getComplaintById = catchAsync(async (req, res, next) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, student: req.user._id };
  const complaint = await Complaint.findOne(filter).populate('student', 'name email department').populate('resolvedBy', 'name');
  if (!complaint) return next(new AppError('Complaint not found.', 404));

  res.status(200).json({ success: true, data: { complaint } });
});

// @route PATCH /api/complaints/:id/resolve — Admin
exports.resolveComplaint = catchAsync(async (req, res, next) => {
  const { status, adminResponse } = req.body;

  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    {
      status,
      ...(adminResponse !== undefined && { adminResponse }),
      ...(['resolved', 'rejected'].includes(status) && { resolvedBy: req.user._id, resolvedAt: new Date() }),
    },
    { new: true, runValidators: true }
  ).populate('student', 'name email');

  if (!complaint) return next(new AppError('Complaint not found.', 404));

  await notifyUsers({
    io: req.app.get('io'),
    target: [complaint.student._id],
    type: 'announcement',
    title: 'Your complaint was updated',
    message: `"${complaint.subject}" is now marked as ${status.replace('_', ' ')}.`,
    link: `/complaints`,
    createdBy: req.user._id,
  });

  res.status(200).json({ success: true, message: 'Complaint updated.', data: { complaint } });
});
