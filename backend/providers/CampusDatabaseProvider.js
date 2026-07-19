const BaseProvider = require('./BaseProvider');
const Note = require('../models/Note');
const Pyq = require('../models/Pyq');
const AcademicResource = require('../models/AcademicResource');

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i === 0) return bytes + ' ' + sizes[i];
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

class CampusDatabaseProvider extends BaseProvider {
  constructor() {
    super('Campus Database', 'campus_db');
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

    const userIdStr = user?._id?.toString();

    // 1. QUERY NOTES
    const notesQuery = {};
    if (department) notesQuery.department = department.toUpperCase();
    if (semester) notesQuery.semester = Number(semester);
    if (subject) notesQuery.subject = { $regex: new RegExp('^' + subject + '$', 'i') };
    if (unit) notesQuery.unit = unit;
    if (bookmarkedOnly === 'true') {
      if (!user) return [];
      notesQuery.bookmarkedBy = user._id;
    }
    if (fileType) {
      if (fileType.toLowerCase() === 'pdf') notesQuery.fileType = 'pdf';
      else if (fileType.toLowerCase() === 'ppt' || fileType.toLowerCase() === 'pptx') notesQuery.fileType = 'ppt';
      else if (fileType.toLowerCase() === 'docx') notesQuery.fileType = 'docx';
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      notesQuery.$or = [
        { title: searchRegex },
        { subject: searchRegex },
        { description: searchRegex }
      ];
    }

    let notes = [];
    // Only query Notes if category is blank, or matches notes categories
    const isNotesCategory = !category || ['Notes', 'Lecture PPTs', 'Syllabus', 'Cheat Sheets', 'Formula Sheets', 'Tutorial Sheets', 'Important Questions', 'Question Banks', 'Lab Manuals', 'Lab Records'].some(cat => cat.toLowerCase() === category.toLowerCase());
    
    if (isNotesCategory) {
      notes = await Note.find(notesQuery).populate('uploadedBy', 'name role');
    }

    // 2. QUERY PYQS
    let pyqs = [];
    const isPyqCategory = !category || category.toLowerCase() === 'previous year questions' || category.toLowerCase() === 'pyq';
    if (isPyqCategory && bookmarkedOnly !== 'true') {
      const pyqQuery = {};
      if (department) pyqQuery.department = department.toUpperCase();
      if (semester) pyqQuery.semester = Number(semester);
      if (subject) pyqQuery.subject = { $regex: new RegExp('^' + subject + '$', 'i') };
      if (year) pyqQuery.year = Number(year);
      if (examType) pyqQuery.examType = examType;
      if (fileType && fileType.toLowerCase() !== 'pdf') {
        // PYQs are only PDFs
        pyqs = [];
      } else {
        if (search) {
          const searchRegex = new RegExp(search, 'i');
          pyqQuery.$or = [
            { subject: searchRegex },
            { fileName: searchRegex }
          ];
        }
        pyqs = await Pyq.find(pyqQuery).populate('uploadedBy', 'name role');
      }
    }

    // 3. QUERY ACADEMIC RESOURCE (Faculty / Admin Uploads)
    const arQuery = {
      source: { $in: ['Faculty Upload', 'Admin Upload'] },
      isHidden: false,
      visibility: 'visible',
    };
    if (department) arQuery.department = { $regex: new RegExp(department, 'i') };
    if (semester) arQuery.semester = Number(semester);
    if (subject) arQuery.subject = { $regex: new RegExp('^' + subject + '$', 'i') };
    if (category) arQuery.category = category;
    if (unit) arQuery.unit = unit;
    if (year) arQuery.year = Number(year);
    if (examType) arQuery.examType = examType;
    if (difficulty) arQuery.difficulty = difficulty;
    if (fileType) arQuery.fileType = fileType;
    if (bookmarkedOnly === 'true' && user) {
      arQuery.bookmarkedBy = user._id;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      arQuery.$or = [
        { title: searchRegex },
        { subject: searchRegex },
        { tags: searchRegex },
      ];
    }

    const localResources = await AcademicResource.find(arQuery).populate('uploadedBy', 'name role');

    // 4. MAP TO UNIFIED STRUCTURE
    const unified = [];

    // Map Notes
    notes.forEach(n => {
      let unifiedFileType = 'PDF';
      if (n.fileType === 'ppt') unifiedFileType = 'PPTX';
      else if (n.fileType === 'docx') unifiedFileType = 'DOCX';
      else if (n.fileType === 'drive_link') unifiedFileType = 'Google Docs';

      unified.push({
        _id: n._id,
        title: n.title,
        subject: n.subject,
        semester: n.semester,
        department: n.department,
        unit: n.unit || '',
        description: n.description || '',
        category: 'Notes',
        fileType: unifiedFileType,
        driveUrl: n.fileUrl,
        previewUrl: n.fileUrl,
        downloads: n.downloads || 0,
        views: n.downloads || 0,
        bookmarkedBy: n.bookmarkedBy || [],
        isBookmarked: userIdStr ? n.bookmarkedBy.some(id => id.toString() === userIdStr) : false,
        uploadedBy: n.uploadedBy,
        faculty: n.uploadedBy?.name || 'SRM Faculty',
        fileSize: formatBytes(n.fileSizeBytes),
        fileHash: n.fileHash || '',
        source: 'CampusConnect',
        createdAt: n.createdAt,
      });
    });

    // Map PYQs
    pyqs.forEach(p => {
      unified.push({
        _id: p._id,
        title: `${p.subject} ${p.examType} ${p.year} Question Paper`,
        subject: p.subject,
        semester: p.semester,
        department: p.department,
        unit: '',
        description: p.fileName || 'Previous Year Question Paper',
        category: 'Previous Year Questions',
        fileType: 'PDF',
        driveUrl: p.fileUrl,
        previewUrl: p.fileUrl,
        downloads: p.downloads || 0,
        views: p.downloads || 0,
        bookmarkedBy: [],
        isBookmarked: false,
        uploadedBy: p.uploadedBy,
        faculty: p.uploadedBy?.name || 'SRM Faculty',
        fileSize: formatBytes(p.fileSizeBytes),
        year: p.year,
        examType: p.examType,
        fileHash: p.fileHash || '',
        source: 'CampusConnect',
        createdAt: p.createdAt,
      });
    });

    // Map AcademicResources
    localResources.forEach(r => {
      unified.push({
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
        source: 'CampusConnect',
        createdAt: r.createdAt,
      });
    });

    return unified;
  }
}

module.exports = CampusDatabaseProvider;
