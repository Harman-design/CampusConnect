const AcademicResource = require('../models/AcademicResource');
const UserActivity = require('../models/UserActivity');
const DriveFolder = require('../models/DriveFolder');
const Note = require('../models/Note');
const Pyq = require('../models/Pyq');
const AcademicProviderRegistry = require('../providers/AcademicProviderRegistry');
const { scanGoogleDriveFolder } = require('../services/driveImportService');
const { generateAIContent } = require('../services/geminiService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// @route POST /api/academic/admin/import
// Import a Google Drive folder by URL
exports.importFolder = catchAsync(async (req, res, next) => {
  const { folderUrl } = req.body;
  if (!folderUrl) {
    return next(new AppError('Please provide a Google Drive folder URL.', 400));
  }

  const results = await scanGoogleDriveFolder(folderUrl, req.user._id);

  res.status(200).json({
    success: true,
    message: `Import completed: processed ${results.processed} files. (${results.created} new, ${results.updated} updated, ${results.deleted} deleted)`,
    data: results,
  });
});

// @route POST /api/academic/admin/sync
// Rescan Google Drive folders to fetch new/updated files & clear deleted files
exports.syncFolder = catchAsync(async (req, res, next) => {
  const { folderUrl } = req.body;
  
  if (folderUrl) {
    const results = await scanGoogleDriveFolder(folderUrl, req.user._id);
    return res.status(200).json({
      success: true,
      message: `Folder sync completed: processed ${results.processed} files. (${results.created} new, ${results.updated} updated, ${results.deleted} deleted)`,
      data: results,
    });
  }

  // Sync default simulated path if none provided
  const results = await scanGoogleDriveFolder('https://drive.google.com/drive/folders/default_simulated_folder', req.user._id);
  
  res.status(200).json({
    success: true,
    message: 'Auto-sync completed. All drive links synchronized.',
    data: results,
  });
});

// @route GET /api/academic
// Get, search, sort, and filter academic resources
exports.getResources = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sort,
  } = req.query;

  // Search across all enabled providers, merge, deduplicate, and sort by relevance/priority
  const allResources = await AcademicProviderRegistry.aggregateSearch(req.query, req.user);

  // Apply optional list-wide sorting in addition to relevance ranking if explicitly requested
  if (sort === 'mostDownloaded') {
    allResources.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  } else if (sort === 'mostBookmarked') {
    allResources.sort((a, b) => (b.bookmarkedBy?.length || 0) - (a.bookmarkedBy?.length || 0));
  }

  // Pagination bounds in memory
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;
  const total = allResources.length;

  const paginated = allResources.slice(skip, skip + limitNum);

  res.status(200).json({
    success: true,
    data: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// @route PATCH /api/academic/admin/:id
// Update resource metadata (Admin)
exports.updateResource = catchAsync(async (req, res, next) => {
  let resource = await AcademicResource.findById(req.params.id);
  if (!resource) {
    return next(new AppError('Resource not found.', 404));
  }

  const allowedUpdates = [
    'title', 'description', 'subject', 'semester', 'department', 'unit', 
    'category', 'year', 'examType', 'difficulty', 'isApproved', 'isHidden', 'visibility'
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      resource[field] = req.body[field];
      if (field === 'visibility') {
        resource.isHidden = req.body[field] === 'hidden';
      }
    }
  });

  await resource.save();

  res.status(200).json({
    success: true,
    message: 'Resource updated successfully.',
    data: resource,
  });
});

// @route DELETE /api/academic/admin/:id
// Delete a resource
exports.deleteResource = catchAsync(async (req, res, next) => {
  const resource = await AcademicResource.findByIdAndDelete(req.params.id);
  if (!resource) {
    return next(new AppError('Resource not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Resource deleted successfully.',
  });
});

// @route POST /api/academic/admin/bulk
// Bulk actions (Bulk Edit, Bulk Delete, Bulk Change Semester/Subject/Department/Visibility)
exports.bulkAction = catchAsync(async (req, res, next) => {
  const { ids, action, value, updates } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new AppError('Please provide an array of resource IDs.', 400));
  }

  if (action === 'delete') {
    await AcademicResource.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${ids.length} resources in bulk.`,
    });
  }

  const updateFields = {};
  if (action === 'change-semester') {
    updateFields.semester = Number(value);
  } else if (action === 'change-subject') {
    updateFields.subject = value;
  } else if (action === 'change-department') {
    updateFields.department = value;
  } else if (action === 'change-visibility') {
    updateFields.visibility = value;
    updateFields.isHidden = value === 'hidden';
  } else if (action === 'edit' && updates) {
    Object.keys(updates).forEach((key) => {
      updateFields[key] = updates[key];
    });
  } else {
    return next(new AppError('Invalid bulk action specified.', 400));
  }

  await AcademicResource.updateMany(
    { _id: { $in: ids } },
    { $set: updateFields }
  );

  res.status(200).json({
    success: true,
    message: `Successfully updated ${ids.length} resources in bulk.`,
  });
});

// @route POST /api/academic/:id/download
// Increment downloads and log download activity
exports.registerDownload = catchAsync(async (req, res, next) => {
  let downloadUrl = '';
  let downloadCountVal = 0;

  // 1. Try AcademicResource
  const resource = await AcademicResource.findById(req.params.id);
  if (resource) {
    resource.downloads += 1;
    resource.downloadCount += 1;
    await resource.save();
    downloadUrl = resource.driveUrl;
    downloadCountVal = resource.downloads;

    // Log student activity
    if (req.user) {
      await UserActivity.create({
        userId: req.user._id,
        resourceId: resource._id,
        activityType: 'download',
      });
    }
  } else {
    // 2. Try Note
    const note = await Note.findById(req.params.id);
    if (note) {
      note.downloads += 1;
      await note.save();
      downloadUrl = note.fileUrl;
      downloadCountVal = note.downloads;
    } else {
      // 3. Try Pyq
      const pyq = await Pyq.findById(req.params.id);
      if (pyq) {
        pyq.downloads += 1;
        await pyq.save();
        downloadUrl = pyq.fileUrl;
        downloadCountVal = pyq.downloads;
      }
    }
  }

  if (!downloadUrl) {
    return next(new AppError('Resource not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Download registered.',
    downloads: downloadCountVal,
    url: downloadUrl,
  });
});

// @route POST /api/academic/:id/view
// Log student view activity
exports.registerView = catchAsync(async (req, res, next) => {
  let viewsVal = 0;
  let found = false;

  // 1. Try AcademicResource
  const resource = await AcademicResource.findById(req.params.id);
  if (resource) {
    resource.views += 1;
    await resource.save();
    viewsVal = resource.views;
    found = true;

    if (req.user) {
      await UserActivity.create({
        userId: req.user._id,
        resourceId: resource._id,
        activityType: 'view',
      });
    }
  } else {
    // 2. Try Note
    const note = await Note.findById(req.params.id);
    if (note) {
      viewsVal = 1; // Notes don't track views in model, but return a default count
      found = true;
    } else {
      // 3. Try Pyq
      const pyq = await Pyq.findById(req.params.id);
      if (pyq) {
        viewsVal = 1;
        found = true;
      }
    }
  }

  if (!found) {
    return next(new AppError('Resource not found.', 404));
  }

  res.status(200).json({
    success: true,
    views: viewsVal,
  });
});

// @route POST /api/academic/:id/bookmark
// Toggle bookmark state
exports.toggleBookmark = catchAsync(async (req, res, next) => {
  let isBookmarked = false;
  let found = false;

  // 1. Try AcademicResource
  const resource = await AcademicResource.findById(req.params.id);
  if (resource) {
    const userIdStr = req.user._id.toString();
    const index = resource.bookmarkedBy.findIndex(id => id.toString() === userIdStr);
    if (index === -1) {
      resource.bookmarkedBy.push(req.user._id);
      isBookmarked = true;
    } else {
      resource.bookmarkedBy.splice(index, 1);
    }
    resource.bookmarkCount = resource.bookmarkedBy.length;
    await resource.save();
    found = true;
  } else {
    // 2. Try Note
    const note = await Note.findById(req.params.id);
    if (note) {
      const alreadyBookmarked = note.bookmarkedBy.some((id) => id.equals(req.user._id));
      if (alreadyBookmarked) {
        note.bookmarkedBy.pull(req.user._id);
      } else {
        note.bookmarkedBy.push(req.user._id);
        isBookmarked = true;
      }
      await note.save();
      found = true;
    }
  }

  if (!found) {
    return next(new AppError('Resource not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: isBookmarked ? 'Bookmarked successfully.' : 'Bookmark removed.',
    isBookmarked,
  });
});

// @route POST /api/academic/:id/ai
// Trigger AI insights
exports.generateAI = catchAsync(async (req, res, next) => {
  const { operation } = req.body;
  if (!operation) {
    return next(new AppError('Please specify the AI operation (e.g. summarize).', 400));
  }

  // 1. Try AcademicResource first to record activity
  const resource = await AcademicResource.findById(req.params.id);
  if (resource) {
    resource.views += 1;
    await resource.save();

    if (req.user) {
      await UserActivity.create({
        userId: req.user._id,
        resourceId: resource._id,
        activityType: 'view',
      });
    }
  }

  // Trigger content generation (handles resolving IDs inside geminiService)
  const text = await generateAIContent(req.params.id, operation);

  res.status(200).json({
    success: true,
    text,
  });
});

// @route GET /api/academic/recent-views
// Get 5 most recently viewed resources
exports.getRecentViews = catchAsync(async (req, res, next) => {
  const activities = await UserActivity.find({
    userId: req.user._id,
    activityType: 'view',
  })
    .sort({ timestamp: -1 })
    .limit(5)
    .populate('resourceId');

  // Filter out any activities where the resource was deleted
  const resources = activities
    .filter(a => a.resourceId)
    .map(a => a.resourceId);

  res.status(200).json({
    success: true,
    data: resources,
  });
});

// @route GET /api/academic/recent-downloads
// Get 5 most recently downloaded resources
exports.getRecentDownloads = catchAsync(async (req, res, next) => {
  const activities = await UserActivity.find({
    userId: req.user._id,
    activityType: 'download',
  })
    .sort({ timestamp: -1 })
    .limit(5)
    .populate('resourceId');

  const resources = activities
    .filter(a => a.resourceId)
    .map(a => a.resourceId);

  res.status(200).json({
    success: true,
    data: resources,
  });
});

// @route GET /api/academic/:id/similar
// Get 4 similar resources based on subject, or department + semester
exports.getSimilarResources = catchAsync(async (req, res, next) => {
  const resource = await AcademicResource.findById(req.params.id);
  if (!resource) {
    return next(new AppError('Resource not found.', 404));
  }

  const similar = await AcademicResource.find({
    _id: { $ne: resource._id },
    isHidden: false,
    visibility: 'visible',
    $or: [
      { subject: resource.subject },
      { department: resource.department, semester: resource.semester },
    ],
  })
    .limit(4)
    .populate('uploadedBy', 'name');

  res.status(200).json({
    success: true,
    data: similar,
  });
});

// @route GET /api/academic/admin/analytics
// Analytics reports
exports.getAnalytics = catchAsync(async (req, res, next) => {
  const totalNotes = await AcademicResource.countDocuments({ category: { $ne: 'Previous Year Questions' } });
  const totalPyqs = await AcademicResource.countDocuments({ category: 'Previous Year Questions' });

  const mostDownloadedSubjectQuery = await AcademicResource.aggregate([
    { $group: { _id: '$subject', totalDownloads: { $sum: '$downloads' } } },
    { $sort: { totalDownloads: -1 } },
    { $limit: 1 }
  ]);
  const mostDownloadedSubject = mostDownloadedSubjectQuery[0]?._id || 'None';

  const mostViewedNotes = await AcademicResource.find({ category: { $ne: 'Previous Year Questions' } })
    .sort({ views: -1 })
    .limit(5)
    .select('title views subject');

  const recentUploads = await AcademicResource.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title category source createdAt');

  const downloadsPerSemester = await AcademicResource.aggregate([
    { $group: { _id: '$semester', downloads: { $sum: '$downloads' } } },
    { $sort: { _id: 1 } }
  ]);

  const downloadsPerSubject = await AcademicResource.aggregate([
    { $group: { _id: '$subject', downloads: { $sum: '$downloads' } } },
    { $sort: { downloads: -1 } },
    { $limit: 5 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalNotes,
      totalPyqs,
      mostDownloadedSubject,
      mostViewedNotes,
      recentUploads,
      downloadsPerSemester,
      downloadsPerSubject,
    },
  });
});

// ==========================================
// DRIVE MAPPINGS (Admin CRUD & Sync)
// ==========================================

// @route GET /api/academic/admin/folders
exports.getDriveFolders = catchAsync(async (req, res, next) => {
  const folders = await DriveFolder.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: folders,
  });
});

// @route POST /api/academic/admin/folders
exports.createDriveFolder = catchAsync(async (req, res, next) => {
  const { department, semester, subject, category, driveFolderUrl, faculty, credits } = req.body;
  if (!department || !semester || !subject || !driveFolderUrl) {
    return next(new AppError('Please provide department, semester, subject, and folder URL.', 400));
  }

  const { extractFolderId } = require('../services/driveImportService');
  const driveFolderId = extractFolderId(driveFolderUrl);
  if (!driveFolderId) {
    return next(new AppError('Invalid Google Drive folder URL.', 400));
  }

  // Create mapping record
  const mapping = await DriveFolder.create({
    department,
    semester,
    subject,
    category: category || 'All',
    driveFolderUrl,
    driveFolderId,
    faculty,
    credits,
    status: 'Pending',
    importedFiles: 0,
  });

  // Trigger initial synchronization asynchronously
  try {
    const results = await scanGoogleDriveFolder(driveFolderUrl, req.user._id);
    mapping.status = 'Synced';
    mapping.importedFiles = results.processed;
    mapping.lastSyncTime = new Date();
    await mapping.save();
  } catch (err) {
    console.error('[Drive Import Error]', err);
    mapping.status = 'Failed';
    await mapping.save();
  }

  res.status(201).json({
    success: true,
    message: 'Folder mapping registered. Initial sync completed.',
    data: mapping,
  });
});

// @route PUT /api/academic/admin/folders/:id
exports.updateDriveFolder = catchAsync(async (req, res, next) => {
  const mapping = await DriveFolder.findById(req.params.id);
  if (!mapping) {
    return next(new AppError('Drive folder mapping not found.', 404));
  }

  const { department, semester, subject, category, driveFolderUrl, faculty, credits } = req.body;
  const oldFolderId = mapping.driveFolderId;

  if (department) mapping.department = department;
  if (semester) mapping.semester = Number(semester);
  if (subject) mapping.subject = subject;
  if (category) mapping.category = category;
  if (faculty !== undefined) mapping.faculty = faculty;
  if (credits !== undefined) mapping.credits = Number(credits);

  if (driveFolderUrl && driveFolderUrl !== mapping.driveFolderUrl) {
    const { extractFolderId } = require('../services/driveImportService');
    const newFolderId = extractFolderId(driveFolderUrl);
    if (!newFolderId) {
      return next(new AppError('Invalid Google Drive folder URL.', 400));
    }
    mapping.driveFolderUrl = driveFolderUrl;
    mapping.driveFolderId = newFolderId;
    mapping.status = 'Pending';
    await mapping.save();

    // Trigger sync for new URL
    try {
      const results = await scanGoogleDriveFolder(driveFolderUrl, req.user._id);
      mapping.status = 'Synced';
      mapping.importedFiles = results.processed;
      mapping.lastSyncTime = new Date();
      await mapping.save();

      // Clean up orphaned resources from old URL mapping
      if (oldFolderId && oldFolderId !== newFolderId) {
        await AcademicResource.deleteMany({ parentFolderId: oldFolderId });
        console.log(`[Drive Update] Cleaned up old resources for folderId: ${oldFolderId}`);
      }
    } catch (err) {
      console.error('[Drive Import Error]', err);
      mapping.status = 'Failed';
      await mapping.save();
    }
  } else {
    await mapping.save();
  }

  res.status(200).json({
    success: true,
    message: 'Drive folder mapping updated.',
    data: mapping,
  });
});

// @route DELETE /api/academic/admin/folders/:id
exports.deleteDriveFolder = catchAsync(async (req, res, next) => {
  const mapping = await DriveFolder.findById(req.params.id);
  if (!mapping) {
    return next(new AppError('Drive folder mapping not found.', 404));
  }

  // Delete all resources associated with this drive folder
  await AcademicResource.deleteMany({ parentFolderId: mapping.driveFolderId });
  await DriveFolder.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Drive folder mapping and associated resources deleted successfully.',
  });
});

// @route POST /api/academic/admin/folders/:id/sync
exports.syncDriveFolder = catchAsync(async (req, res, next) => {
  const mapping = await DriveFolder.findById(req.params.id);
  if (!mapping) {
    return next(new AppError('Drive folder mapping not found.', 404));
  }

  try {
    mapping.status = 'Pending';
    await mapping.save();

    const results = await scanGoogleDriveFolder(mapping.driveFolderUrl, req.user._id);
    mapping.status = 'Synced';
    mapping.importedFiles = results.processed;
    mapping.lastSyncTime = new Date();
    await mapping.save();

    res.status(200).json({
      success: true,
      message: `Folder sync completed successfully. Synced ${results.processed} files.`,
      data: mapping,
    });
  } catch (err) {
    console.error('[Drive Sync Error]', err);
    mapping.status = 'Failed';
    await mapping.save();
    return next(new AppError(`Sync failed: ${err.message}`, 500));
  }
});

// @route POST /api/academic/admin/folders/sync-all
exports.syncAllDriveFolders = catchAsync(async (req, res, next) => {
  const mappings = await DriveFolder.find();
  const summary = { processed: 0, succeeded: 0, failed: 0 };

  for (const mapping of mappings) {
    try {
      mapping.status = 'Pending';
      await mapping.save();

      const results = await scanGoogleDriveFolder(mapping.driveFolderUrl, req.user._id);
      mapping.status = 'Synced';
      mapping.importedFiles = results.processed;
      mapping.lastSyncTime = new Date();
      await mapping.save();
      summary.succeeded++;
    } catch (err) {
      console.error(`[Drive Sync All Error] Folder ${mapping.subject}:`, err.message);
      mapping.status = 'Failed';
      await mapping.save();
      summary.failed++;
    }
    summary.processed++;
  }

  res.status(200).json({
    success: true,
    message: `Sync-all complete. Processed ${summary.processed} folders. Succeeded: ${summary.succeeded}, Failed: ${summary.failed}.`,
    data: summary,
  });
});

// ==========================================
// STUDENT SUBJECT PORTAL BROWSE
// ==========================================

// @route GET /api/academic/subjects
exports.getSubjects = catchAsync(async (req, res, next) => {
  const { department, semester } = req.query;

  const allResources = await AcademicProviderRegistry.aggregateSearch({
    department,
    semester,
  }, req.user);

  // Read drive folder mappings to get configured subjects
  const driveFolders = await DriveFolder.find(department ? { department: department.toUpperCase() } : {});

  const subjectsMap = {};

  // Initialize with driveFolders config
  for (const df of driveFolders) {
    const key = `${df.department}_${df.semester}_${df.subject.toLowerCase()}`;
    subjectsMap[key] = {
      id: df._id,
      subject: df.subject,
      semester: df.semester,
      department: df.department,
      faculty: df.faculty,
      credits: df.credits,
      notesCount: 0,
      pyqsCount: 0,
      totalCount: 0,
      mapped: true,
    };
  }

  // Merge counts from active resources
  for (const r of allResources) {
    const key = `${r.department.toUpperCase()}_${r.semester}_${r.subject.toLowerCase()}`;
    const isPyq = r.category === 'Previous Year Questions';

    if (!subjectsMap[key]) {
      subjectsMap[key] = {
        subject: r.subject,
        semester: r.semester,
        department: r.department.toUpperCase(),
        faculty: 'SRM Faculty',
        credits: 4,
        notesCount: 0,
        pyqsCount: 0,
        totalCount: 0,
        mapped: false,
      };
    }

    if (isPyq) {
      subjectsMap[key].pyqsCount++;
    } else {
      subjectsMap[key].notesCount++;
    }
    subjectsMap[key].totalCount++;
  }

  let list = Object.values(subjectsMap);

  // Filter list by department & semester to be absolutely sure
  if (department) {
    list = list.filter(s => s.department === department.toUpperCase());
  }
  if (semester) {
    list = list.filter(s => s.semester === Number(semester));
  }

  res.status(200).json({
    success: true,
    data: list,
  });
});

// @route GET /api/academic/subjects/:subjectName
exports.getSubjectDetails = catchAsync(async (req, res, next) => {
  const subjectName = req.params.subjectName;
  const { department, semester } = req.query;

  const allResources = await AcademicProviderRegistry.aggregateSearch({
    subject: subjectName,
    department,
    semester,
  }, req.user);

  // Find mapping metadata
  const mappingQuery = { subject: { $regex: new RegExp('^' + subjectName + '$', 'i') } };
  if (department) mappingQuery.department = department.toUpperCase();
  if (semester) mappingQuery.semester = Number(semester);
  const df = await DriveFolder.findOne(mappingQuery);

  let notesCount = 0;
  let pyqCount = 0;
  let assignmentCount = 0;
  let labCount = 0;
  let referenceCount = 0;

  for (const r of allResources) {
    if (r.category === 'Previous Year Questions') {
      pyqCount++;
    } else {
      notesCount++;
    }

    if (r.category === 'Assignments') {
      assignmentCount++;
    } else if (r.category === 'Lab Manuals' || r.category === 'Lab Records') {
      labCount++;
    } else if (r.category === 'Reference Books') {
      referenceCount++;
    }
  }

  // Get 5 recent uploads
  const sortedByDate = [...allResources].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const recentUploads = sortedByDate.slice(0, 5).map(r => ({
    _id: r._id,
    title: r.title,
    category: r.category,
    driveUrl: r.driveUrl,
    previewUrl: r.previewUrl,
    fileSize: r.fileSize,
    createdAt: r.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      subject: subjectName,
      department: df ? df.department : (department || 'CSE'),
      semester: df ? df.semester : (Number(semester) || 4),
      faculty: df ? df.faculty : 'SRM Faculty',
      credits: df ? df.credits : 4,
      counts: {
        notes: notesCount,
        pyqs: pyqCount,
        assignments: assignmentCount,
        labs: labCount,
        reference: referenceCount,
      },
      recentUploads,
    },
  });
});

// ==========================================
// ADMIN PROVIDER INTEGRATIONS
// ==========================================

// @route GET /api/academic/admin/providers
// Get provider config and sync status
exports.getProvidersConfig = catchAsync(async (req, res, next) => {
  const configs = await AcademicProviderRegistry.getAdminStatus();
  res.status(200).json({
    success: true,
    data: configs,
  });
});

// @route PUT /api/academic/admin/providers
// Update provider priorities/status
exports.updateProvidersConfig = catchAsync(async (req, res, next) => {
  const { config } = req.body;
  if (!config) {
    return next(new AppError('Please provide a provider config array.', 400));
  }
  const updated = await AcademicProviderRegistry.updateConfig(config);
  res.status(200).json({
    success: true,
    message: 'Provider configurations updated successfully.',
    data: updated,
  });
});

// @route POST /api/academic/admin/providers/:providerId/refresh
// Refresh/Sync a provider cache
exports.refreshProviderCache = catchAsync(async (req, res, next) => {
  const { providerId } = req.params;
  const result = await AcademicProviderRegistry.syncProvider(providerId, req.user);
  res.status(200).json({
    success: true,
    message: result.message,
    data: result.data,
  });
});
