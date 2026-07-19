const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { notifyUsers } = require('../services/notificationService');

async function countActiveRegistrations(eventId) {
  return EventRegistration.countDocuments({ event: eventId, status: 'registered' });
}

// @route POST /api/events — Admin
exports.createEvent = catchAsync(async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user._id });

  await notifyUsers({
    io: req.app.get('io'),
    target: 'students',
    type: 'event',
    title: 'New event: ' + event.title,
    message: `Happening on ${new Date(event.startAt).toLocaleString()}${event.venue ? ` at ${event.venue}` : ''}.`,
    link: `/events?highlight=${event._id}`,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Event created.', data: { event } });
});

// @route GET /api/events — Student & Admin
exports.getEvents = catchAsync(async (req, res) => {
  const { search, category, upcomingOnly } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };
  if (upcomingOnly === 'true') filter.startAt = { $gte: new Date() };

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ startAt: 1 }).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  const eventIds = events.map((e) => e._id);
  const registrationCounts = await EventRegistration.aggregate([
    { $match: { event: { $in: eventIds }, status: 'registered' } },
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(registrationCounts.map((r) => [r._id.toString(), r.count]));

  let myRegistrations = new Map();
  if (req.user.role === 'student') {
    const mine = await EventRegistration.find({ event: { $in: eventIds }, student: req.user._id, status: 'registered' });
    myRegistrations = new Map(mine.map((r) => [r.event.toString(), true]));
  }

  const eventsWithMeta = events.map((e) => ({
    ...e.toObject(),
    registeredCount: countMap.get(e._id.toString()) || 0,
    isFull: e.capacity > 0 && (countMap.get(e._id.toString()) || 0) >= e.capacity,
    isRegistered: myRegistrations.get(e._id.toString()) || false,
  }));

  res.status(200).json({ success: true, data: { events: eventsWithMeta, pagination: buildPaginationMeta(total, page, limit) } });
});

// @route GET /api/events/:id
exports.getEventById = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) return next(new AppError('Event not found.', 404));

  const registeredCount = await countActiveRegistrations(event._id);
  let isRegistered = false;
  if (req.user.role === 'student') {
    const reg = await EventRegistration.findOne({ event: event._id, student: req.user._id, status: 'registered' });
    isRegistered = !!reg;
  }

  res.status(200).json({
    success: true,
    data: {
      event: {
        ...event.toObject(),
        registeredCount,
        isFull: event.capacity > 0 && registeredCount >= event.capacity,
        isRegistered,
      },
    },
  });
});

// @route PATCH /api/events/:id — Admin
exports.updateEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!event) return next(new AppError('Event not found.', 404));
  res.status(200).json({ success: true, message: 'Event updated.', data: { event } });
});

// @route DELETE /api/events/:id — Admin
exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return next(new AppError('Event not found.', 404));
  await EventRegistration.deleteMany({ event: event._id });
  res.status(200).json({ success: true, message: 'Event deleted.' });
});

// @route POST /api/events/:id/register — Student
exports.registerForEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) return next(new AppError('Event not found.', 404));

  if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
    return next(new AppError('Registration for this event has closed.', 400));
  }

  const existing = await EventRegistration.findOne({ event: event._id, student: req.user._id });

  if (existing && existing.status === 'registered') {
    return next(new AppError('You are already registered for this event.', 409));
  }

  if (event.capacity > 0) {
    const currentCount = await countActiveRegistrations(event._id);
    if (currentCount >= event.capacity) {
      return next(new AppError('This event has reached full capacity.', 400));
    }
  }

  let registration;
  if (existing) {
    // Re-registering after a previous cancellation
    existing.status = 'registered';
    existing.cancelledAt = null;
    registration = await existing.save();
  } else {
    registration = await EventRegistration.create({ event: event._id, student: req.user._id });
  }

  res.status(201).json({ success: true, message: 'Registered for event successfully.', data: { registration } });
});

// @route DELETE /api/events/:id/register — Student (cancel registration)
exports.cancelRegistration = catchAsync(async (req, res, next) => {
  const registration = await EventRegistration.findOne({ event: req.params.id, student: req.user._id, status: 'registered' });
  if (!registration) return next(new AppError('You are not registered for this event.', 404));

  registration.status = 'cancelled';
  registration.cancelledAt = new Date();
  await registration.save();

  res.status(200).json({ success: true, message: 'Registration cancelled.' });
});

// @route GET /api/events/my-registrations — Student
exports.getMyRegistrations = catchAsync(async (req, res) => {
  const registrations = await EventRegistration.find({ student: req.user._id, status: 'registered' })
    .populate('event', 'title startAt endAt venue category')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { registrations } });
});

// @route GET /api/events/:id/registrations — Admin (view all registrations for an event)
exports.getEventRegistrations = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) return next(new AppError('Event not found.', 404));

  const registrations = await EventRegistration.find({ event: event._id, status: 'registered' })
    .populate('student', 'name email department semester')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { registrations } });
});
