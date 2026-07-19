const catchAsync = require('../utils/catchAsync');
const { parseDateRange } = require('../utils/dateRange');
const analyticsService = require('../services/analyticsService');

// @route GET /api/analytics/overview — Admin
exports.getOverview = catchAsync(async (req, res) => {
  const metrics = await analyticsService.getOverviewMetrics();
  res.status(200).json({ success: true, data: metrics });
});

// @route GET /api/analytics/downloads — Admin
exports.getDownloads = catchAsync(async (req, res) => {
  const { department, semester, subject } = req.query;
  const data = await analyticsService.getDownloadsBreakdown({ department, semester, subject });
  res.status(200).json({ success: true, data });
});

// @route GET /api/analytics/events — Admin
exports.getEvents = catchAsync(async (req, res) => {
  const { start, end } = parseDateRange(req.query);
  const data = await analyticsService.getEventAnalytics({ start, end });
  res.status(200).json({ success: true, data: { ...data, dateRange: { start, end } } });
});

// @route GET /api/analytics/placements — Admin
exports.getPlacements = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const range = startDate || endDate ? parseDateRange(req.query, 365) : null;
  const data = await analyticsService.getPlacementAnalytics(range || {});
  res.status(200).json({ success: true, data });
});

// @route GET /api/analytics/users — Admin
exports.getUsers = catchAsync(async (req, res) => {
  const { start, end } = parseDateRange(req.query);
  const data = await analyticsService.getUserAnalytics({ start, end });
  res.status(200).json({ success: true, data: { ...data, dateRange: { start, end } } });
});
