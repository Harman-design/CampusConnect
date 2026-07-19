const BaseProvider = require('./BaseProvider');
const AcademicResource = require('../models/AcademicResource');

const PUBLIC_HELPER_RESOURCES_FALLBACK = [
  {
    driveFileId: 'helper_textbook_calculus',
    title: 'Calculus Volume 1 - OpenStax Textbook',
    fileName: 'Calculus_Volume_1_OpenStax.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileSize: '14.5 MB',
    driveUrl: 'https://openstax.org/details/books/calculus-volume-1',
    previewUrl: 'https://openstax.org/books/calculus-volume-1/pages/1-introduction',
    thumbnail: 'https://placehold.co/300x400/4F8CFF/ffffff?text=Calculus+OpenStax',
    semester: 1,
    subject: 'Mathematics',
    department: 'MATH',
    category: 'Reference Books',
    description: 'Legally permitted open-license calculus textbook covering limits, derivatives, integration.',
    unit: '',
    year: 2023,
    examType: 'Semester',
    difficulty: 'Medium',
    tags: ['Mathematics', 'Calculus', 'OpenStax', 'Reference Books'],
  },
  {
    driveFileId: 'helper_notes_daa_mit',
    title: 'Design and Analysis of Algorithms - MIT Lecture Slides',
    fileName: 'MIT_6_006_Algorithms_Slides.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileSize: '3.4 MB',
    driveUrl: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
    previewUrl: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec1/',
    thumbnail: 'https://placehold.co/300x400/7C3AED/ffffff?text=MIT+Algorithms',
    semester: 4,
    subject: 'Design and Analysis of Algorithms',
    department: 'CSE',
    category: 'Lecture PPTs',
    description: 'Publicly accessible lecture notes on algorithms, asymptotic complexity, sorting, graphs, and dynamic programming.',
    unit: '1',
    year: 2020,
    examType: 'Semester',
    difficulty: 'Hard',
    tags: ['Algorithms', 'DAA', 'MIT OCW', 'Notes'],
  },
  {
    driveFileId: 'helper_notes_os_concepts',
    title: 'Operating Systems Courseware & Study Guide',
    fileName: 'OS_Concepts_Study_Guide.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileSize: '2.1 MB',
    driveUrl: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    previewUrl: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    thumbnail: 'https://placehold.co/300x400/22C55E/ffffff?text=OS+OSTEP',
    semester: 4,
    subject: 'Operating Systems',
    department: 'CSE',
    category: 'Notes',
    description: 'Three Easy Pieces open textbook chapters covering Virtualization, Concurrency, and Persistence.',
    unit: '2',
    year: 2022,
    examType: 'Semester',
    difficulty: 'Medium',
    tags: ['OS', 'Operating Systems', 'OSTEP', 'Notes'],
  },
  {
    driveFileId: 'helper_pyq_physics_solved',
    title: 'Engineering Physics solved board question keys',
    fileName: 'Solved_Physics_Exam_2021.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileSize: '1.8 MB',
    driveUrl: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01sc_w01d2_exam/',
    previewUrl: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/resources/mit8_01sc_w01d2_exam/',
    thumbnail: 'https://placehold.co/300x400/EF4444/ffffff?text=Physics+Solved',
    semester: 1,
    subject: 'Physics',
    department: 'PHYS',
    category: 'Previous Year Questions',
    description: 'Solved questions and study guidelines for physics fundamentals under creative commons license.',
    unit: '',
    year: 2021,
    examType: 'Semester',
    difficulty: 'Medium',
    tags: ['Physics', 'Solved', 'MIT OCW', 'PYQs'],
  },
  {
    driveFileId: 'helper_assignment_discrete',
    title: 'Discrete Mathematics Practice Problems Set',
    fileName: 'Discrete_Math_Problems.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileSize: '750 KB',
    driveUrl: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/resources/mit6_042js15_assn01/',
    previewUrl: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/resources/mit6_042js15_assn01/',
    thumbnail: 'https://placehold.co/300x400/F59E0B/ffffff?text=Math+Discrete',
    semester: 3,
    subject: 'Mathematics',
    department: 'CSE',
    category: 'Assignments',
    description: 'Discrete mathematics practice assignments covering sets, induction, and logic.',
    unit: '1',
    year: 2019,
    examType: 'Semester',
    difficulty: 'Medium',
    tags: ['Discrete Mathematics', 'Maths', 'Assignment', 'MIT OCW'],
  }
];

class HelperProvider extends BaseProvider {
  constructor() {
    super('Helper', 'helper');
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
      source: 'The Helper',
      isHidden: false, 
      visibility: 'visible' 
    };

    if (user && user.role === 'admin') {
      delete query.isHidden;
      delete query.visibility;
    }

    if (category) {
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
      faculty: r.uploadedBy?.name || 'Public Contributor',
      fileSize: r.fileSize || '0 KB',
      year: r.year,
      examType: r.examType,
      fileHash: r.fileHash || '',
      source: 'Helper',
      createdAt: r.createdAt,
    }));
  }

  async sync(user) {
    console.log('[Helper Provider] Syncing cache from public open coursewares...');
    
    let publicResources = [];
    let isMockFallback = false;

    // Try fetching from a public API if configured in environments
    const HELPER_API_URL = process.env.HELPER_API_URL || 'https://api.helper-academic-resources.org/v1/resources';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

      const response = await fetch(HELPER_API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const body = await response.json();
        if (body && Array.isArray(body.resources)) {
          publicResources = body.resources;
          console.log(`[Helper Provider] Fetched ${publicResources.length} resources from ${HELPER_API_URL}`);
        }
      } else {
        throw new Error(`HTTP Error ${response.status}`);
      }
    } catch (err) {
      console.warn(`[Helper Provider] Failed to contact Helper API: ${err.message}. Cascading to offline public dataset simulator.`);
      publicResources = PUBLIC_HELPER_RESOURCES_FALLBACK;
      isMockFallback = true;
    }

    const results = { created: 0, updated: 0, processed: 0 };
    const adminId = user?._id || null;

    // Upsert into AcademicResource with source 'The Helper'
    for (const res of publicResources) {
      const resourceData = {
        title: res.title,
        fileName: res.fileName,
        fileType: res.fileType || 'PDF',
        mimeType: res.mimeType || 'application/pdf',
        fileSize: res.fileSize || '1.0 MB',
        driveUrl: res.driveUrl,
        previewUrl: res.previewUrl || res.driveUrl,
        thumbnail: res.thumbnail || 'https://placehold.co/300x400/64748b/ffffff?text=Academic+Resource',
        uploadedBy: adminId,
        source: 'The Helper',
        semester: Number(res.semester) || 1,
        subject: res.subject || 'General',
        department: res.department || 'CSE',
        category: res.category || 'Notes',
        unit: res.unit || '',
        year: Number(res.year) || new Date().getFullYear(),
        examType: res.examType || 'Semester',
        difficulty: res.difficulty || 'Medium',
        parentFolderId: 'helper_cache_folder',
        driveFolderId: 'helper_cache_folder',
        visibility: 'visible',
        tags: res.tags || [res.subject, res.category].filter(Boolean),
        description: res.description || 'Public academic courseware document.',
        fileHash: res.fileHash || `helper_${res.driveFileId}_hash`,
      };

      const existing = await AcademicResource.findOne({ driveFileId: res.driveFileId });
      if (existing) {
        await AcademicResource.findOneAndUpdate(
          { driveFileId: res.driveFileId },
          { $set: resourceData }
        );
        results.updated++;
      } else {
        await AcademicResource.create({
          ...resourceData,
          driveFileId: res.driveFileId,
        });
        results.created++;
      }
      results.processed++;
    }

    // Update settings last sync metadata
    return {
      success: true,
      message: `Helper provider cache updated. Processed ${results.processed} files (${results.created} created, ${results.updated} updated).`,
      data: {
        processed: results.processed,
        created: results.created,
        updated: results.updated,
        isMockFallback,
      }
    };
  }

  async getSyncStatus() {
    const cachedCount = await AcademicResource.countDocuments({ source: 'The Helper' });
    
    // Read key system settings metadata if available
    const lastResource = await AcademicResource.findOne({ source: 'The Helper' }).sort({ updatedAt: -1 });

    return {
      status: cachedCount > 0 ? 'Synced' : 'Pending',
      totalCached: cachedCount,
      lastSync: lastResource ? lastResource.updatedAt : null,
    };
  }
}

module.exports = HelperProvider;
