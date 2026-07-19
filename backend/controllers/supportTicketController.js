const SupportTicket = require('../models/SupportTicket');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { notifyUsers } = require('../services/notificationService');

// @route POST /api/support-tickets — Student
exports.createTicket = catchAsync(async (req, res) => {
  const ticket = await SupportTicket.create({ ...req.body, student: req.user._id });

  await notifyUsers({
    io: req.app.get('io'),
    target: 'admins',
    type: 'announcement',
    title: 'New support ticket',
    message: `${req.user.name} opened a ticket: "${ticket.subject}"`,
    link: `/admin/support-tickets?highlight=${ticket._id}`,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Support ticket created.', data: { ticket } });
});

// @route GET /api/support-tickets — Student sees own; Admin sees all
exports.getTickets = catchAsync(async (req, res) => {
  const { status, category } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = req.user.role === 'admin' ? {} : { student: req.user._id };
  if (status) filter.status = status;
  if (category) filter.category = category;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('student', 'name email department')
      .select('-responses') // list view omits the full thread for brevity
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { tickets, pagination: buildPaginationMeta(total, page, limit) } });
});

// @route GET /api/support-tickets/:id — includes full response thread
exports.getTicketById = catchAsync(async (req, res, next) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, student: req.user._id };
  const ticket = await SupportTicket.findOne(filter)
    .populate('student', 'name email department')
    .populate('responses.sender', 'name role');

  if (!ticket) return next(new AppError('Support ticket not found.', 404));

  res.status(200).json({ success: true, data: { ticket } });
});

// @route POST /api/support-tickets/:id/responses — Student or Admin
exports.addResponse = catchAsync(async (req, res, next) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, student: req.user._id };
  const ticket = await SupportTicket.findOne(filter);
  if (!ticket) return next(new AppError('Support ticket not found.', 404));

  if (['resolved', 'closed'].includes(ticket.status)) {
    return next(new AppError('This ticket is already closed. Reopen it before adding a response.', 400));
  }

  ticket.responses.push({ sender: req.user._id, senderRole: req.user.role, message: req.body.message });
  if (req.user.role === 'admin' && ticket.status === 'open') {
    ticket.status = 'in_progress';
  }
  await ticket.save();

  // Notify the other party
  const notifyTarget = req.user.role === 'admin' ? [ticket.student] : 'admins';
  await notifyUsers({
    io: req.app.get('io'),
    target: notifyTarget,
    type: 'announcement',
    title: 'New reply on your support ticket',
    message: `"${ticket.subject}" has a new response.`,
    link: req.user.role === 'admin' ? `/support-tickets/${ticket._id}` : `/admin/support-tickets/${ticket._id}`,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Response added.', data: { ticket } });
});

// @route PATCH /api/support-tickets/:id/status — Admin
exports.updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { status, ...(['resolved', 'closed'].includes(status) && { resolvedAt: new Date() }) },
    { new: true, runValidators: true }
  ).populate('student', 'name email');

  if (!ticket) return next(new AppError('Support ticket not found.', 404));

  await notifyUsers({
    io: req.app.get('io'),
    target: [ticket.student._id],
    type: 'announcement',
    title: 'Support ticket status updated',
    message: `"${ticket.subject}" is now marked as ${status.replace('_', ' ')}.`,
    link: `/support-tickets/${ticket._id}`,
    createdBy: req.user._id,
  });

  res.status(200).json({ success: true, message: 'Ticket status updated.', data: { ticket } });
});
