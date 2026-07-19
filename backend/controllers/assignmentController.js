const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const User = require('../models/User');
const { uploadFileToFirebase } = require('../services/firebaseUploadService');
const { notifyUsers } = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @route GET /api/assignments
// Get assignments created by the faculty (or all if admin)
exports.getCreatedAssignments = catchAsync(async (req, res, next) => {
  let query = {};
  if (req.user.role === 'faculty') {
    query.createdBy = req.user._id;
  }
  const assignments = await Assignment.find(query).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: assignments,
  });
});

// @route POST /api/assignments
// Create an Assignment (Faculty & Admin)
exports.createAssignment = catchAsync(async (req, res, next) => {
  const { title, description, subject, dueDate, department, semester } = req.body;

  if (!title || !subject || !dueDate || !department || !semester) {
    return next(new AppError('Please fill in all required fields.', 400));
  }

  let fileUrl = '';
  if (req.file) {
    const uploadResult = await uploadFileToFirebase(req.file, 'assignments');
    fileUrl = uploadResult.fileUrl;
  }

  const assignment = await Assignment.create({
    title,
    description,
    subject,
    dueDate: new Date(dueDate),
    department,
    semester: Number(semester),
    fileUrl,
    createdBy: req.user._id,
  });

  // Notify relevant students
  const targetStudents = await User.find({
    role: 'student',
    department,
    semester: Number(semester),
    isActive: true,
  }).select('_id');

  const studentIds = targetStudents.map((s) => s._id.toString());
  if (studentIds.length > 0) {
    const io = req.app.get('io');
    await notifyUsers({
      io,
      target: studentIds,
      type: 'assignment',
      title: `New Assignment: ${title}`,
      message: `A new assignment has been posted for ${subject}. Due: ${new Date(dueDate).toLocaleDateString()}`,
      link: '/assignments',
      createdBy: req.user._id,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully.',
    data: assignment,
  });
});

// @route PUT /api/assignments/:id
// Edit Assignment (Faculty & Admin)
exports.updateAssignment = catchAsync(async (req, res, next) => {
  const { title, description, subject, dueDate, department, semester } = req.body;

  let assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new AppError('Assignment not found.', 404));
  }

  // Ensure faculty only edits their own assignments (admins can edit all)
  if (req.user.role === 'faculty' && assignment.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to edit this assignment.', 403));
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (subject) updateData.subject = subject;
  if (dueDate) updateData.dueDate = new Date(dueDate);
  if (department) updateData.department = department;
  if (semester) updateData.semester = Number(semester);

  if (req.file) {
    const uploadResult = await uploadFileToFirebase(req.file, 'assignments');
    updateData.fileUrl = uploadResult.fileUrl;
  }

  assignment = await Assignment.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

  res.status(200).json({
    success: true,
    message: 'Assignment updated successfully.',
    data: assignment,
  });
});

// @route DELETE /api/assignments/:id
// Delete Assignment (Faculty & Admin)
exports.deleteAssignment = catchAsync(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new AppError('Assignment not found.', 404));
  }

  if (req.user.role === 'faculty' && assignment.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to delete this assignment.', 403));
  }

  // Delete all submissions for this assignment
  await AssignmentSubmission.deleteMany({ assignment: assignment._id });
  await Assignment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully.',
  });
});

// @route GET /api/assignments/student/me
// Get student assignments classified by status (Pending, Submitted, Overdue)
exports.getStudentAssignments = catchAsync(async (req, res, next) => {
  const { department, semester } = req.user;

  if (!department || !semester) {
    return res.status(200).json({
      success: true,
      data: { pending: [], submitted: [], overdue: [] },
    });
  }

  // Find all assignments matching student's department and semester
  const assignments = await Assignment.find({
    department,
    semester: Number(semester),
  }).sort({ dueDate: 1 });

  // Get student's submissions
  const submissions = await AssignmentSubmission.find({ student: req.user._id });
  const submissionMap = submissions.reduce((acc, sub) => {
    acc[sub.assignment.toString()] = sub;
    return acc;
  }, {});

  const pending = [];
  const submitted = [];
  const overdue = [];

  const now = new Date();

  assignments.forEach((assignment) => {
    const sub = submissionMap[assignment._id.toString()];
    const plainAssignment = assignment.toObject();
    
    if (sub) {
      plainAssignment.submission = sub;
      submitted.push(plainAssignment);
    } else if (new Date(assignment.dueDate) < now) {
      overdue.push(plainAssignment);
    } else {
      pending.push(plainAssignment);
    }
  });

  res.status(200).json({
    success: true,
    data: {
      pending,
      submitted,
      overdue,
    },
  });
});

// @route POST /api/assignments/:id/submit
// Submit an Assignment (Student)
exports.submitAssignment = catchAsync(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new AppError('Assignment not found.', 404));
  }

  if (!req.file) {
    return next(new AppError('Please upload a submission file.', 400));
  }

  const uploadResult = await uploadFileToFirebase(req.file, 'submissions');

  const now = new Date();
  const isLate = now > new Date(assignment.dueDate);
  const status = isLate ? 'Late' : 'Submitted';

  // Create or update submission
  const submission = await AssignmentSubmission.findOneAndUpdate(
    {
      assignment: assignment._id,
      student: req.user._id,
    },
    {
      fileUrl: uploadResult.fileUrl,
      fileName: req.file.originalname,
      status,
      submittedAt: now,
    },
    { new: true, upsert: true }
  );

  // Notify the faculty who created the assignment
  const io = req.app.get('io');
  await notifyUsers({
    io,
    target: [assignment.createdBy.toString()],
    type: 'announcement',
    title: `Submission Received: ${req.user.name}`,
    message: `${req.user.name} submitted the assignment for ${assignment.subject}${isLate ? ' (Late)' : ''}.`,
    link: `/faculty/assignments`,
    createdBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: 'Assignment submitted successfully.',
    data: submission,
  });
});

// @route GET /api/assignments/:id/submissions
// View all submissions for an assignment (Faculty & Admin)
exports.getSubmissions = catchAsync(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new AppError('Assignment not found.', 404));
  }

  if (req.user.role === 'faculty' && assignment.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to view submissions for this assignment.', 403));
  }

  const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
    .populate('student', 'name email registerNumber department semester')
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    data: submissions,
  });
});

// @route POST /api/assignments/submissions/:subId/grade
// Grade & Feedback on submission (Faculty & Admin)
exports.gradeSubmission = catchAsync(async (req, res, next) => {
  const { grade, feedback = '' } = req.body;

  if (!grade) {
    return next(new AppError('Grade is required.', 400));
  }

  const submission = await AssignmentSubmission.findById(req.params.subId).populate('assignment');
  if (!submission) {
    return next(new AppError('Submission not found.', 404));
  }

  // Verify authorization (assignment owner or admin)
  if (req.user.role === 'faculty' && submission.assignment.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to grade this submission.', 403));
  }

  submission.grade = grade;
  submission.feedback = feedback;
  submission.status = 'Graded';
  await submission.save();

  // Notify student
  const io = req.app.get('io');
  await notifyUsers({
    io,
    target: [submission.student.toString()],
    type: 'assignment',
    title: `Assignment Graded: ${submission.assignment.title}`,
    message: `Your submission for ${submission.assignment.subject} was graded. Grade: ${grade}.`,
    link: '/assignments',
    createdBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: 'Submission graded successfully.',
    data: submission,
  });
});
