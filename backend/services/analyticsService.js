const User = require('../models/User');
const Note = require('../models/Note');
const Pyq = require('../models/Pyq');
const Placement = require('../models/Placement');
const Application = require('../models/Application');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Complaint = require('../models/Complaint');
const SupportTicket = require('../models/SupportTicket');

/**
 * Top-level metric cards for the admin dashboard. Every count is a direct
 * read against an existing collection — nothing here is derived or mocked.
 */
async function getOverviewMetrics() {
  const [
    totalUsers,
    activeUsers,
    totalNotes,
    notesDownloadsAgg,
    totalPyqs,
    pyqDownloadsAgg,
    totalPlacements,
    totalApplications,
    totalEvents,
    totalRegistrations,
    totalComplaints,
    totalSupportTickets,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Note.countDocuments(),
    Note.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]),
    Pyq.countDocuments(),
    Pyq.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]),
    Placement.countDocuments(),
    Application.countDocuments(),
    Event.countDocuments(),
    EventRegistration.countDocuments({ status: 'registered' }),
    Complaint.countDocuments(),
    SupportTicket.countDocuments(),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalNotes,
    totalNotesDownloads: notesDownloadsAgg[0]?.total || 0,
    totalPyqs,
    totalPyqDownloads: pyqDownloadsAgg[0]?.total || 0,
    totalPlacements,
    totalApplications,
    totalEvents,
    totalRegistrations,
    totalComplaints,
    totalSupportTickets,
  };
}

/**
 * Notes downloads by subject + PYQ downloads by semester.
 * Downloads are a running counter on each document (no separate download-log
 * collection), so this reflects current totals rather than a time series.
 */
async function getDownloadsBreakdown({ department, semester, subject } = {}) {
  const noteFilter = {};
  const pyqFilter = {};
  if (department) {
    noteFilter.department = department;
    pyqFilter.department = department;
  }
  if (semester) {
    noteFilter.semester = Number(semester);
    pyqFilter.semester = Number(semester);
  }
  if (subject) {
    noteFilter.subject = new RegExp(subject, 'i');
    pyqFilter.subject = new RegExp(subject, 'i');
  }

  const [notesBySubject, pyqsBySemester] = await Promise.all([
    Note.aggregate([
      { $match: noteFilter },
      { $group: { _id: '$subject', downloads: { $sum: '$downloads' }, noteCount: { $sum: 1 } } },
      { $sort: { downloads: -1 } },
      { $limit: 15 },
      { $project: { _id: 0, subject: '$_id', downloads: 1, noteCount: 1 } },
    ]),
    Pyq.aggregate([
      { $match: pyqFilter },
      { $group: { _id: '$semester', downloads: { $sum: '$downloads' }, pyqCount: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, semester: '$_id', downloads: 1, pyqCount: 1 } },
    ]),
  ]);

  return { notesBySubject, pyqsBySemester };
}

/**
 * Event registrations over time (daily counts within the given range),
 * plus a breakdown by category for extra context.
 */
async function getEventAnalytics({ start, end }) {
  const [registrationsOverTime, registrationsByCategory] = await Promise.all([
    EventRegistration.aggregate([
      { $match: { status: 'registered', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]),
    EventRegistration.aggregate([
      { $match: { status: 'registered' } },
      { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'event' } },
      { $unwind: '$event' },
      { $group: { _id: '$event.category', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const totalEvents = await Event.countDocuments();
  const upcomingEvents = await Event.countDocuments({ startAt: { $gte: new Date() } });

  return { registrationsOverTime, registrationsByCategory, totalEvents, upcomingEvents };
}

/**
 * Placement applications by company, plus a status-pipeline breakdown
 * (applied / shortlisted / rejected / selected) for the funnel view.
 */
async function getPlacementAnalytics({ start, end } = {}) {
  const matchStage = start && end ? { createdAt: { $gte: start, $lte: end } } : {};

  const [applicationsByCompany, applicationsByStatus] = await Promise.all([
    Application.aggregate([
      { $match: matchStage },
      { $lookup: { from: 'placements', localField: 'placement', foreignField: '_id', as: 'placement' } },
      { $unwind: '$placement' },
      { $group: { _id: '$placement.companyName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
      { $project: { _id: 0, companyName: '$_id', count: 1 } },
    ]),
    Application.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]),
  ]);

  const totalPlacements = await Placement.countDocuments();
  const openPlacements = await Placement.countDocuments({ status: { $ne: 'closed' } });

  return { applicationsByCompany, applicationsByStatus, totalPlacements, openPlacements };
}

/**
 * Daily active users, using each user's existing `lastLoginAt` field as the
 * activity signal (no separate session/activity-log collection required).
 */
async function getUserAnalytics({ start, end }) {
  const [dailyActiveUsers, usersByRole, newSignupsOverTime] = await Promise.all([
    User.aggregate([
      { $match: { lastLoginAt: { $gte: start, $lte: end, $ne: null } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastLoginAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }, { $project: { _id: 0, role: '$_id', count: 1 } }]),
    User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]),
  ]);

  return { dailyActiveUsers, usersByRole, newSignupsOverTime };
}

module.exports = {
  getOverviewMetrics,
  getDownloadsBreakdown,
  getEventAnalytics,
  getPlacementAnalytics,
  getUserAnalytics,
};
