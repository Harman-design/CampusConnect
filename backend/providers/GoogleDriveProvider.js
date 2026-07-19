const BaseProvider = require('./BaseProvider');
const AcademicResource = require('../models/AcademicResource');
const DriveFolder = require('../models/DriveFolder');
const { scanGoogleDriveFolder } = require('../services/driveImportService');

class GoogleDriveProvider extends BaseProvider {
  constructor() {
    super('Google Drive', 'google_drive');
  }

  async search(filters, user) {
    const {
      search,
      category,
      semester,
      department,
      unit,
      year,
      examType,
      difficulty,
      fileType,
      bookmarkedOnly,
      subject,
    } = filters;

    const query = { 
      source: 'Google Drive',
      isHidden: false, 
      visibility: 'visible' 
    };

    if (user && user.role === 'admin') {
      delete query.isHidden;
      delete query.visibility;
    }

    if (category) {
      // Map frontend category checks
      if (category.toLowerCase() === 'notes') {
        query.category = { $ne: 'Previous Year Questions' };
      } else if (category.toLowerCase() === 'previous year questions' || category.toLowerCase() === 'pyq') {
        query.category = 'Previous Year Questions';
      } else {
        query.category = category;
      }
    }
    if (semester) query.semester = Number(semester);
    if (department) query.department = { $regex: new RegExp(department, 'i') };
    if (unit) query.unit = unit;
    if (year) query.year = Number(year);
    if (examType) query.examType = examType;
    if (difficulty) query.difficulty = difficulty;
    if (fileType) query.fileType = fileType;
    if (subject) query.subject = { $regex: new RegExp('^' + subject + '$', 'i') };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { subject: searchRegex },
        { tags: searchRegex },
      ];
    }

    if (bookmarkedOnly === 'true' && user) {
      query.bookmarkedBy = user._id;
    }

    const resources = await AcademicResource.find(query).populate('uploadedBy', 'name role');
    const userIdStr = user?._id?.toString();

    return resources.map(r => ({
      _id: r._id,
      title: r.title,
      subject: r.subject,
      semester: r.semester,
      department: r.department,
      unit: r.unit || '',
      description: r.description || '',
      category: r.category,
      fileType: r.fileType || 'PDF',
      driveUrl: r.driveUrl,
      previewUrl: r.previewUrl || r.driveUrl,
      downloads: r.downloads || 0,
      views: r.views || 0,
      bookmarkedBy: r.bookmarkedBy || [],
      isBookmarked: userIdStr ? r.bookmarkedBy.some(id => id.toString() === userIdStr) : false,
      uploadedBy: r.uploadedBy,
      faculty: r.uploadedBy?.name || 'SRM Faculty',
      fileSize: r.fileSize || '0 KB',
      year: r.year,
      examType: r.examType,
      fileHash: r.fileHash || '',
      source: 'Google Drive',
      createdAt: r.createdAt,
    }));
  }

  async sync(user) {
    console.log('[Google Drive Provider] Starting sync of all drive folders...');
    const mappings = await DriveFolder.find();
    const summary = { processed: 0, succeeded: 0, failed: 0 };
    const adminId = user?._id || null;

    for (const mapping of mappings) {
      try {
        mapping.status = 'Pending';
        await mapping.save();

        const results = await scanGoogleDriveFolder(mapping.driveFolderUrl, adminId);
        mapping.status = 'Synced';
        mapping.importedFiles = results.processed;
        mapping.lastSyncTime = new Date();
        await mapping.save();
        summary.succeeded++;
      } catch (err) {
        console.error(`[Drive Sync Error] Folder ${mapping.subject}:`, err.message);
        mapping.status = 'Failed';
        await mapping.save();
        summary.failed++;
      }
      summary.processed++;
    }

    return {
      success: true,
      message: `Google Drive sync complete. Processed ${summary.processed} folders. Succeeded: ${summary.succeeded}, Failed: ${summary.failed}.`,
      data: summary,
    };
  }

  async getSyncStatus() {
    const mappings = await DriveFolder.find();
    const total = mappings.length;
    const synced = mappings.filter(m => m.status === 'Synced').length;
    const failed = mappings.filter(m => m.status === 'Failed').length;
    
    let status = 'Synced';
    if (failed > 0) status = 'Failed';
    else if (total > synced) status = 'Pending';

    const lastSyncTime = mappings.reduce((max, m) => {
      if (!m.lastSyncTime) return max;
      return !max || m.lastSyncTime > max ? m.lastSyncTime : max;
    }, null);

    return {
      status,
      totalFolders: total,
      syncedFolders: synced,
      failedFolders: failed,
      lastSync: lastSyncTime || new Date(),
    };
  }
}

module.exports = GoogleDriveProvider;
