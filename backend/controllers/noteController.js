const Note = require('../models/Note');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { uploadFileToFirebase, deleteFileFromFirebase } = require('../services/firebaseUploadService');
const { mimeToFileType } = require('../middleware/upload');
const { notifyUsers } = require('../services/notificationService');

// @route POST /api/notes (multipart file upload) — Admin
exports.createNoteFile = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('A PDF or PPT file is required.', 400));
  }

  const fileType = mimeToFileType(req.file.mimetype);
  const { fileUrl, storagePath } = await uploadFileToFirebase(req.file, 'notes');

  const note = await Note.create({
    ...req.body,
    fileType,
    fileUrl,
    fileName: req.file.originalname,
    fileSizeBytes: req.file.size,
    storagePath,
    uploadedBy: req.user._id,
  });

  await notifyUsers({
    io: req.app.get('io'),
    target: 'students',
    type: 'notes',
    title: 'New note uploaded',
    message: `${note.title} (${note.subject}, Semester ${note.semester}) is now available.`,
    link: `/notes?highlight=${note._id}`,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Note uploaded successfully.', data: { note } });
});

// @route POST /api/notes/drive-link — Admin
exports.createNoteDriveLink = catchAsync(async (req, res) => {
  const { driveLink, ...meta } = req.body;

  const note = await Note.create({
    ...meta,
    fileType: 'drive_link',
    fileUrl: driveLink,
    uploadedBy: req.user._id,
  });

  await notifyUsers({
    io: req.app.get('io'),
    target: 'students',
    type: 'notes',
    title: 'New note uploaded',
    message: `${note.title} (${note.subject}, Semester ${note.semester}) is now available.`,
    link: `/notes?highlight=${note._id}`,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Note link added successfully.', data: { note } });
});

// @route GET /api/notes — Student & Admin (search + filter + paginate)
exports.getNotes = catchAsync(async (req, res) => {
  const { search, department, semester, subject, unit, bookmarkedOnly } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (unit) filter.unit = unit;
  if (search) filter.$text = { $search: search };
  if (bookmarkedOnly === 'true') filter.bookmarkedBy = req.user._id;

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .populate('uploadedBy', 'name email')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Note.countDocuments(filter),
  ]);

  const withBookmarkFlag = notes.map((n) => ({
    ...n.toObject(),
    isBookmarked: n.bookmarkedBy.some((id) => id.equals(req.user._id)),
    bookmarkedBy: undefined,
  }));

  res.status(200).json({
    success: true,
    data: { notes: withBookmarkFlag, pagination: buildPaginationMeta(total, page, limit) },
  });
});

// @route GET /api/notes/:id
exports.getNoteById = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id).populate('uploadedBy', 'name email');
  if (!note) return next(new AppError('Note not found.', 404));

  res.status(200).json({
    success: true,
    data: {
      note: {
        ...note.toObject(),
        isBookmarked: note.bookmarkedBy.some((id) => id.equals(req.user._id)),
        bookmarkedBy: undefined,
      },
    },
  });
});

// @route PATCH /api/notes/:id — Admin
exports.updateNote = catchAsync(async (req, res, next) => {
  const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!note) return next(new AppError('Note not found.', 404));

  res.status(200).json({ success: true, message: 'Note updated successfully.', data: { note } });
});

// @route DELETE /api/notes/:id — Admin
exports.deleteNote = catchAsync(async (req, res, next) => {
  const note = await Note.findByIdAndDelete(req.params.id);
  if (!note) return next(new AppError('Note not found.', 404));

  if (note.storagePath) {
    await deleteFileFromFirebase(note.storagePath);
  }

  res.status(200).json({ success: true, message: 'Note deleted successfully.' });
});

// @route POST /api/notes/:id/download — Student & Admin
exports.registerDownload = catchAsync(async (req, res, next) => {
  const note = await Note.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
  if (!note) return next(new AppError('Note not found.', 404));

  res.status(200).json({ success: true, data: { fileUrl: note.fileUrl, downloads: note.downloads } });
});

// @route POST /api/notes/:id/bookmark — Student & Admin (toggle)
exports.toggleBookmark = catchAsync(async (req, res, next) => {
  const note = await Note.findById(req.params.id);
  if (!note) return next(new AppError('Note not found.', 404));

  const alreadyBookmarked = note.bookmarkedBy.some((id) => id.equals(req.user._id));

  if (alreadyBookmarked) {
    note.bookmarkedBy.pull(req.user._id);
  } else {
    note.bookmarkedBy.push(req.user._id);
  }
  await note.save();

  res.status(200).json({
    success: true,
    message: alreadyBookmarked ? 'Bookmark removed.' : 'Note bookmarked.',
    data: { isBookmarked: !alreadyBookmarked },
  });
});
