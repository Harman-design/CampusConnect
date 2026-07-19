const Attendance = require('../models/Attendance');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @route POST /api/attendance
// Mark or Bulk Mark/Update Attendance
exports.markAttendance = catchAsync(async (req, res, next) => {
  const { department, semester, subject, date, records } = req.body; // records: [{ studentId, status, remarks }]

  if (!department || !semester || !subject || !records || !Array.isArray(records)) {
    return next(new AppError('Please provide department, semester, subject, and records array.', 400));
  }

  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  const results = [];
  for (const rec of records) {
    const { studentId, status, remarks = '' } = rec;
    
    // Find or create record for student on this date for this subject
    const attendance = await Attendance.findOneAndUpdate(
      {
        student: studentId,
        subject,
        date: attendanceDate,
      },
      {
        status,
        remarks,
        markedBy: req.user._id,
        semester,
        department,
      },
      { new: true, upsert: true }
    );
    results.push(attendance);
  }

  res.status(200).json({
    success: true,
    message: `Attendance marked successfully for ${results.length} students.`,
    data: results,
  });
});

// @route GET /api/attendance/student/me
// Get Student's own attendance, subject-wise analysis, and skip calculators
exports.getStudentAttendance = catchAsync(async (req, res, next) => {
  const studentId = req.user._id;

  const records = await Attendance.find({ student: studentId }).sort({ date: -1 });

  // Compute stats
  const subjectStats = {};
  let totalPresent = 0;
  let totalClasses = records.length;

  records.forEach((rec) => {
    const { subject, status } = rec;
    if (!subjectStats[subject]) {
      subjectStats[subject] = { present: 0, total: 0, absent: 0, late: 0, excused: 0 };
    }
    
    subjectStats[subject].total += 1;
    if (status === 'Present') {
      subjectStats[subject].present += 1;
      totalPresent += 1;
    } else if (status === 'Absent') {
      subjectStats[subject].absent += 1;
    } else if (status === 'Late') {
      // Late counts as present or partial? Let's treat it as present for percentage but track separately
      subjectStats[subject].present += 1;
      subjectStats[subject].late += 1;
      totalPresent += 1;
    } else if (status === 'Excused') {
      subjectStats[subject].excused += 1;
      // Excused classes can be omitted from target calculation or count as present. Let's count as present/excused
      subjectStats[subject].present += 1;
      totalPresent += 1;
    }
  });

  const subjectList = Object.keys(subjectStats).map((subj) => {
    const stats = subjectStats[subj];
    const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 100;
    
    // Skip calculator for this subject (75% threshold)
    let skipCalculator = { status: 'safe', count: 0 };
    const threshold = 0.75;
    
    if (percentage >= 75) {
      // How many classes can I skip?
      // (P / (T + S)) >= 0.75 => P >= 0.75T + 0.75S => 0.75S <= P - 0.75T => S <= (P - 0.75T) / 0.75
      const maxSkip = Math.floor((stats.present - threshold * stats.total) / threshold);
      skipCalculator = { status: 'safe', count: Math.max(0, maxSkip) };
    } else {
      // How many classes must I attend consecutively to hit 75%?
      // (P + A) / (T + A) >= 0.75 => P + A >= 0.75T + 0.75A => 0.25A >= 0.75T - P => A >= (0.75T - P) / 0.25
      const mustAttend = Math.ceil((threshold * stats.total - stats.present) / (1 - threshold));
      skipCalculator = { status: 'danger', count: Math.max(0, mustAttend) };
    }

    return {
      subject: subj,
      ...stats,
      percentage,
      skipCalculator,
    };
  });

  const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;
  
  // Safe Leave calculator for overall
  let overallSkipCalculator = { status: 'safe', count: 0 };
  const threshold = 0.75;
  if (overallPercentage >= 75) {
    const maxSkip = Math.floor((totalPresent - threshold * totalClasses) / threshold);
    overallSkipCalculator = { status: 'safe', count: Math.max(0, maxSkip) };
  } else {
    const mustAttend = Math.ceil((threshold * totalClasses - totalPresent) / (1 - threshold));
    overallSkipCalculator = { status: 'danger', count: Math.max(0, mustAttend) };
  }

  res.status(200).json({
    success: true,
    data: {
      records,
      overallStats: {
        totalPresent,
        totalClasses,
        percentage: overallPercentage,
        skipCalculator: overallSkipCalculator,
      },
      subjectStats: subjectList,
    },
  });
});

// @route GET /api/attendance/report
// Export Attendance Report as List
exports.exportAttendanceReport = catchAsync(async (req, res, next) => {
  const { department, semester, subject } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject = subject;

  const records = await Attendance.find(filter)
    .populate('student', 'name email registerNumber')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    data: records,
  });
});
