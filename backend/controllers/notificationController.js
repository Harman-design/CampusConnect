const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { notifyUsers } = require('../services/notificationService');

// @route POST /api/notifications/broadcast — Admin
exports.broadcast = catchAsync(async (req, res) => {
  const { title, message, type = 'announcement', target, link } = req.body;
  const io = req.app.get('io');

  const { count } = await notifyUsers({ io, target, type, title, message, link, createdBy: req.user._id });

  res.status(201).json({ success: true, message: `Notification sent to ${count} recipient(s).`, data: { count } });
});

// @route GET /api/notifications — Student & Admin (own notifications)
exports.getMyNotifications = catchAsync(async (req, res) => {
  const { isRead, type } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { recipient: req.user._id };
  if (isRead !== undefined) filter.isRead = isRead === 'true';
  if (type) filter.type = type;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    data: { notifications, unreadCount, pagination: buildPaginationMeta(total, page, limit) },
  });
});

// @route GET /api/notifications/unread-count — Student & Admin
exports.getUnreadCount = catchAsync(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.status(200).json({ success: true, data: { unreadCount } });
});

// @route PATCH /api/notifications/:id/read — Student & Admin
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return next(new AppError('Notification not found.', 404));

  res.status(200).json({ success: true, data: { notification } });
});

// @route PATCH /api/notifications/mark-all-read — Student & Admin
exports.markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});
