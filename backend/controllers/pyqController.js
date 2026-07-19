const Pyq = require('../models/Pyq');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { uploadFileToFirebase, deleteFileFromFirebase } = require('../services/firebaseUploadService');
const { notifyUsers } = require('../services/notificationService');

// @route POST /api/pyqs (multipart PDF upload) — Admin
exports.createPyq = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('A PDF file is required.', 400));
  }
  if (req.file.mimetype !== 'application/pdf') {
    return next(new AppError('PYQs must be uploaded as PDF files.', 400));
  }

  const { fileUrl, storagePath } = await uploadFileToFirebase(req.file, 'pyqs');

  const pyq = await Pyq.create({
    ...req.body,
    fileUrl,
    fileName: req.file.originalname,
    fileSizeBytes: req.file.size,
    storagePath,
    uploadedBy: req.user._id,
  });

  await notifyUsers({
    io: req.app.get('io'),
    target: 'students',
    type: 'pyq',
    title: 'New PYQ uploaded',
    message: `${pyq.subject} (${pyq.examType} ${pyq.year}) is now available.`,
    link: `/pyqs?highlight=${pyq._id}`,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'PYQ uploaded successfully.', data: { pyq } });
});

// @route GET /api/pyqs — Student & Admin (search + filter + paginate)
exports.getPyqs = catchAsync(async (req, res) => {
  const { search, department, semester, subject, year, examType } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (year) filter.year = Number(year);
  if (examType) filter.examType = examType;
  if (search) filter.$text = { $search: search };

  const [pyqs, total] = await Promise.all([
    Pyq.find(filter)
      .populate('uploadedBy', 'name email')
      .sort(search ? { score: { $meta: 'textScore' } } : { year: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Pyq.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { pyqs, pagination: buildPaginationMeta(total, page, limit) },
  });
});

// @route GET /api/pyqs/:id
exports.getPyqById = catchAsync(async (req, res, next) => {
  const pyq = await Pyq.findById(req.params.id).populate('uploadedBy', 'name email');
  if (!pyq) return next(new AppError('PYQ not found.', 404));
  res.status(200).json({ success: true, data: { pyq } });
});

// @route PATCH /api/pyqs/:id — Admin
exports.updatePyq = catchAsync(async (req, res, next) => {
  const pyq = await Pyq.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!pyq) return next(new AppError('PYQ not found.', 404));
  res.status(200).json({ success: true, message: 'PYQ updated successfully.', data: { pyq } });
});

// @route DELETE /api/pyqs/:id — Admin
exports.deletePyq = catchAsync(async (req, res, next) => {
  const pyq = await Pyq.findByIdAndDelete(req.params.id);
  if (!pyq) return next(new AppError('PYQ not found.', 404));

  if (pyq.storagePath) {
    await deleteFileFromFirebase(pyq.storagePath);
  }

  res.status(200).json({ success: true, message: 'PYQ deleted successfully.' });
});

// @route POST /api/pyqs/:id/download — Student & Admin
exports.registerDownload = catchAsync(async (req, res, next) => {
  const pyq = await Pyq.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
  if (!pyq) return next(new AppError('PYQ not found.', 404));

  res.status(200).json({ success: true, data: { fileUrl: pyq.fileUrl, downloads: pyq.downloads } });
});
