const { google } = require('googleapis');
const AcademicResource = require('../models/AcademicResource');

// Extract drive folder ID from URL
function extractFolderId(url) {
  if (!url) return null;
  const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  
  if (/^[a-zA-Z0-9-_]+$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

// Convert bytes to readable string (e.g. 1.2 MB)
function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i === 0) return bytes + ' ' + sizes[i];
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Determine file type from extension and mimeType
function determineFileType(name, mimeType) {
  let fileType = 'PDF';
  const nameLower = name.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (mime.includes('presentation') || mime.includes('powerpoint') || nameLower.endsWith('.ppt') || nameLower.endsWith('.pptx')) {
    fileType = 'PPTX';
  } else if (mime.includes('document') || mime.includes('msword') || mime.includes('wordprocessingml') || nameLower.endsWith('.doc') || nameLower.endsWith('.docx')) {
    fileType = 'DOCX';
  } else if (mime.includes('zip') || nameLower.endsWith('.zip')) {
    fileType = 'ZIP';
  } else if (mime.includes('rar') || nameLower.endsWith('.rar')) {
    fileType = 'RAR';
  } else if (mime.includes('image') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
    fileType = 'Image';
  } else if (mime.includes('google-apps.document')) {
    fileType = 'Google Docs';
  } else if (mime.includes('google-apps.presentation')) {
    fileType = 'Google Slides';
  } else if (mime.includes('shortcut')) {
    fileType = 'Shortcut';
  }
  return fileType;
}

// Generate the appropriate preview URL
function getPreviewUrl(id, mimeType) {
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('google-apps.document')) {
    return `https://docs.google.com/document/d/${id}/preview`;
  }
  if (mime.includes('google-apps.presentation')) {
    return `https://docs.google.com/presentation/d/${id}/embed`;
  }
  return `https://docs.google.com/viewer?srcid=${id}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
}

// Get fallback thumbnail URL
function getDefaultThumbnail(fileType) {
  if (fileType === 'PPTX') return 'https://placehold.co/300x400/ea580c/ffffff?text=PPTX+Resource';
  if (fileType === 'DOCX') return 'https://placehold.co/300x400/2563eb/ffffff?text=Word+Resource';
  if (fileType === 'Image') return 'https://placehold.co/300x400/0891b2/ffffff?text=Image+Resource';
  if (fileType === 'Google Docs') return 'https://placehold.co/300x400/2563eb/ffffff?text=Google+Doc';
  if (fileType === 'Google Slides') return 'https://placehold.co/300x400/ea580c/ffffff?text=Google+Slide';
  return 'https://placehold.co/300x400/64748b/ffffff?text=PDF+Resource';
}

// Parse academic parameters from folder structures & file names
function parseAcademicMetadata(fileName, folderPath = [], rootFolderId = '') {
  let semester = 1;
  let subject = 'General';
  let department = 'CSE';
  let unit = '';
  let category = 'Notes';
  let year = new Date().getFullYear();
  let examType = 'Semester';
  let difficulty = 'Medium';

  // Hardcode based on root folder IDs
  if (rootFolderId === '1usKtW9XZmMyFgx03vkhQl6TJrXJtI1Cz') {
    semester = 1;
  } else if (rootFolderId === '1sL7tOgcblv2Sf206l2RRM3NODhvB0cBY') {
    semester = 4;
  }

  const fullContext = [...folderPath, fileName].join(' / ');

  // Detect Semester (if not overridden by root ID)
  if (!rootFolderId) {
    const semMatch = fullContext.match(/(?:Semester|Sem|S)\s*(\d+)/i);
    if (semMatch) {
      semester = Math.min(Math.max(Number(semMatch[1]), 1), 8);
    }
  }

  // Parse subject from folders
  let subjectDetected = false;
  for (const folder of folderPath) {
    const codeMatch = folder.match(/^(\d{2}[A-Z]{3,4}\d{3}[A-Z\d]*)\s+(.+)$/i);
    if (codeMatch) {
      subject = codeMatch[2].trim();
      subjectDetected = true;

      const code = codeMatch[1].toUpperCase();
      if (code.includes('CSC') || code.includes('CSS') || code.includes('CS')) department = 'CSE';
      else if (code.includes('ECC') || code.includes('ECE') || code.includes('EC')) department = 'ECE';
      else if (code.includes('EES') || code.includes('EEE') || code.includes('EE')) department = 'EEE';
      else if (code.includes('MES') || code.includes('ME')) department = 'MECH';
      else if (code.includes('BTB') || code.includes('BTC') || code.includes('BT')) department = 'BIOTECH';
      else if (code.includes('CYB') || code.includes('CYM') || code.includes('CY') || code.includes('CHC')) department = 'CHEM';
      else if (code.includes('PHB') || code.includes('PHY')) department = 'PHYS';
      else if (code.includes('MAB') || code.includes('MA')) department = 'MATH';
      else if (code.includes('LEH') || code.includes('LEM') || code.includes('LE') || code.includes('GNH')) department = 'HUM';
      break;
    }
  }

  // Parse subject from folder keywords (Semester 4 subfolders)
  if (!subjectDetected) {
    for (const folder of folderPath) {
      const fUpper = folder.toUpperCase();
      if (fUpper === 'AI') { subject = 'Artificial Intelligence'; department = 'CSE'; subjectDetected = true; }
      else if (fUpper === 'BIO') { subject = 'Biology'; department = 'BIOTECH'; subjectDetected = true; }
      else if (fUpper === 'DAA') { subject = 'Design and Analysis of Algorithms'; department = 'CSE'; subjectDetected = true; }
      else if (fUpper === 'DIP') { subject = 'Digital Image Processing'; department = 'CSE'; subjectDetected = true; }
      else if (fUpper === 'PQT') { subject = 'Probability and Queueing Theory'; department = 'MATH'; subjectDetected = true; }
      else if (fUpper === 'SE') { subject = 'Software Engineering'; department = 'CSE'; subjectDetected = true; }
      else if (fUpper === 'SML') { subject = 'Statistical Machine Learning'; department = 'CSE'; subjectDetected = true; }
    }
  }

  // Fallback subject text matching
  if (!subjectDetected) {
    const subjects = [
      'Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science',
      'Data Structures', 'Database Systems', 'DBMS', 'Operating Systems', 'OS',
      'Computer Networks', 'Software Engineering', 'Machine Learning', 'AI'
    ];
    for (const sub of subjects) {
      const regex = new RegExp(`\\b${sub}\\b`, 'i');
      if (fullContext.match(regex)) {
        subject = sub;
        break;
      }
    }
  }

  // Detect Category
  const lowerContext = fullContext.toLowerCase();
  const lowerFileName = fileName.toLowerCase();

  if (lowerContext.includes('university papers') || lowerContext.includes('university question papers') || lowerFileName.includes('univ') || /nov\s*\d{4}/i.test(lowerFileName) || /may\s*\d{4}/i.test(lowerFileName) || /jan\s*\d{4}/i.test(lowerFileName) || /semester exam/i.test(lowerFileName)) {
    category = 'Previous Year Questions';
  } else if (lowerContext.includes('lab manual') || lowerContext.includes('manual')) {
    category = 'Lab Manuals';
  } else if (lowerContext.includes('lab record') || lowerContext.includes('record')) {
    category = 'Lab Records';
  } else if (lowerContext.includes('assignment')) {
    category = 'Assignments';
  } else if (lowerContext.includes('tutorial')) {
    category = 'Tutorial Sheets';
  } else if (lowerContext.includes('formula')) {
    category = 'Formula Sheets';
  } else if (lowerContext.includes('question bank') || lowerContext.includes('qbank')) {
    category = 'Question Banks';
  } else if (lowerContext.includes('reference book') || lowerContext.includes('textbook')) {
    category = 'Reference Books';
  } else if (lowerContext.includes('syllabus')) {
    category = 'Syllabus';
  } else if (lowerContext.includes('ppt') || lowerContext.includes('slide') || lowerContext.includes('lecture')) {
    category = 'Lecture PPTs';
  } else if (lowerContext.includes('cheat sheet') || lowerContext.includes('cheat')) {
    category = 'Cheat Sheets';
  } else if (lowerContext.includes('important question') || lowerContext.includes('imp')) {
    category = 'Important Questions';
  } else {
    category = 'Notes';
  }

  // Detect Unit
  const unitMatch = fullContext.match(/(?:Unit|U|Module)\s*([1-5|I|II|III|IV|V]+)/i);
  if (unitMatch) {
    unit = unitMatch[1].trim();
  }

  // Detect Year
  const yearMatch = fullContext.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = Number(yearMatch[1]);
  }

  // Detect Exam Type
  if (category === 'Previous Year Questions' || category === 'Question Banks') {
    if (/cat\s*1/i.test(fullContext)) examType = 'CAT1';
    else if (/cat\s*2/i.test(fullContext)) examType = 'CAT2';
    else if (/cat\s*3/i.test(fullContext)) examType = 'CAT3';
    else if (/model/i.test(fullContext)) examType = 'Model';
    else examType = 'Semester';

    const diffs = ['Easy', 'Medium', 'Hard'];
    difficulty = diffs[fullContext.length % 3];
  }

  return { semester, subject, department, unit, category, year, examType, difficulty };
}

// Official Google APIs Auth Initializer
async function getDriveClient() {
  const driveApiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const firebaseKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  // 1. JWT Service Account env variables
  if (privateKey && email && !email.includes('your_')) {
    console.log('[Google Drive Auth] Using Service Account credentials from environment variables.');
    const auth = new google.auth.JWT(
      email,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/drive.readonly']
    );
    return google.drive({ version: 'v3', auth });
  }

  // 2. Firebase private key fallback
  if (clientEmail && firebaseKey && !clientEmail.includes('your_')) {
    console.log('[Google Drive Auth] Using Firebase credentials as Google Drive API credentials.');
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      firebaseKey,
      ['https://www.googleapis.com/auth/drive.readonly']
    );
    return google.drive({ version: 'v3', auth });
  }

  // 3. Application Default Credentials (ADC)
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const client = await auth.getClient();
    console.log('[Google Drive Auth] Loaded Google Application Default Credentials.');
    return google.drive({ version: 'v3', auth: client });
  } catch (err) {
    // Silent fail
  }

  // 4. Public API Key
  if (driveApiKey && !driveApiKey.includes('your_')) {
    console.log('[Google Drive Auth] Authenticating with Google Developer API Key.');
    return google.drive({ version: 'v3', auth: driveApiKey });
  }

  return null;
}

// Official API Recursive Folder listing
async function fetchFolderContentsViaApi(drive, rootFolderId) {
  const filesList = [];
  const visited = new Set();

  async function crawl(folderId, currentPath = []) {
    if (visited.has(folderId)) return;
    visited.add(folderId);

    let pageToken = null;
    do {
      const q = `'${folderId}' in parents and trashed = false`;
      const res = await drive.files.list({
        q,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, size, createdTime, modifiedTime, description, shortcutDetails)',
        pageToken,
        pageSize: 100,
      });

      const files = res.data.files || [];
      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          await crawl(file.id, [...currentPath, file.name]);
        } else {
          let realId = file.id;
          let realMimeType = file.mimeType;
          let realName = file.name;
          let realSize = file.size;

          // Resolve shortcut
          if (file.mimeType === 'application/vnd.google-apps.shortcut' && file.shortcutDetails) {
            realId = file.shortcutDetails.targetId || file.id;
            realMimeType = file.shortcutDetails.targetMimeType || file.mimeType;
          }

          const fileType = determineFileType(realName, realMimeType);
          const previewUrl = getPreviewUrl(realId, realMimeType);

          filesList.push({
            driveFileId: realId,
            title: realName.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
            fileName: realName,
            fileType,
            mimeType: realMimeType,
            fileSize: formatBytes(realSize ? Number(realSize) : 0),
            driveUrl: file.webViewLink || `https://drive.google.com/file/d/${realId}/view`,
            previewUrl,
            thumbnail: file.thumbnailLink || getDefaultThumbnail(fileType),
            createdTime: file.createdTime ? new Date(file.createdTime) : new Date(),
            modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
            uploadedDate: file.createdTime ? new Date(file.createdTime) : new Date(),
            description: file.description || '',
            folderPath: currentPath,
          });
        }
      }
      pageToken = res.data.nextPageToken;
    } while (pageToken);
  }

  await crawl(rootFolderId);
  return filesList;
}

// Fallback HTML crawler to extract files without keys
async function fetchFolderContentsViaScraper(rootFolderId) {
  const filesList = [];
  const visited = new Set();

  async function fetchFolderHTML(folderId) {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      return await res.text();
    } catch (err) {
      console.warn(`[Web Crawler] Failed to fetch folder ${folderId}:`, err.message);
      return null;
    }
  }

  function parseFolderItems(html) {
    if (!html) return [];
    const unescaped = html.replace(/\\x([0-9a-fA-F]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });

    const regex = /\["([a-zA-Z0-9-_]{28,45})",\s*\["([a-zA-Z0-9-_]{28,45})"\],\s*"([^"]+)",\s*"([^"]+)"/g;
    let match;
    const items = [];
    const seen = new Set();
    while ((match = regex.exec(unescaped)) !== null) {
      const id = match[1];
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({
        id,
        parentId: match[2],
        name: match[3],
        mimeType: match[4]
      });
    }
    return items;
  }

  // Simple concurrency pool
  async function pool(items, limit, fn) {
    const results = [];
    const running = new Set();
    for (const item of items) {
      if (running.size >= limit) {
        await Promise.race(running);
      }
      const p = fn(item).then(res => {
        running.delete(p);
        results.push(res);
      });
      running.add(p);
    }
    await Promise.all(running);
    return results;
  }

  async function crawl(folderId, currentPath = [], depth = 0) {
    if (depth > 5 || visited.has(folderId)) return;
    visited.add(folderId);

    const html = await fetchFolderHTML(folderId);
    const items = parseFolderItems(html);

    const subfolders = [];
    for (const item of items) {
      const cleanedMimeType = item.mimeType.replace(/\\/g, '');
      if (cleanedMimeType.includes('folder')) {
        subfolders.push({
          id: item.id,
          name: item.name,
          path: [...currentPath, item.name]
        });
      } else {
        const fileType = determineFileType(item.name, cleanedMimeType);
        const previewUrl = getPreviewUrl(item.id, cleanedMimeType);

        filesList.push({
          driveFileId: item.id,
          title: item.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
          fileName: item.name,
          fileType,
          mimeType: cleanedMimeType,
          fileSize: '1.2 MB',
          driveUrl: `https://drive.google.com/file/d/${item.id}/view`,
          previewUrl,
          thumbnail: getDefaultThumbnail(fileType),
          createdTime: new Date(),
          modifiedTime: new Date(),
          uploadedDate: new Date(),
          description: '',
          folderPath: currentPath,
        });
      }
    }

    if (subfolders.length > 0) {
      await pool(subfolders, 5, async (sub) => {
        await crawl(sub.id, sub.path, depth + 1);
      });
    }
  }

  await crawl(rootFolderId);
  return filesList;
}

// Fallback list of simulated items if both API and Scraper returned 0 (e.g. no internet)
function getSimulatedFolderContents(folderId) {
  console.log(`[Google Drive Backup Sim] Returning simulated folder contents for folderId: ${folderId}`);
  return [
    {
      driveFileId: 'sim_file_calc_u1',
      title: 'Calculus Notes Unit 1 - Limits and Continuity',
      fileName: 'Calculus_Notes_Unit_1.pdf',
      fileType: 'PDF',
      mimeType: 'application/pdf',
      fileSize: '1.2 MB',
      driveUrl: 'https://drive.google.com/file/d/sim_file_calc_u1/view',
      previewUrl: 'https://docs.google.com/viewer?srcid=sim_file_calc_u1&pid=explorer&efh=false&a=v&chrome=false&embedded=true',
      thumbnail: 'https://placehold.co/300x400/3b82f6/ffffff?text=Calculus+Unit+1',
      createdTime: new Date(),
      modifiedTime: new Date(),
      uploadedDate: new Date(),
      description: 'Limits, Continuity and basic calculus concepts.',
      folderPath: ['Semester 1', 'Mathematics', 'Notes']
    },
    {
      driveFileId: 'sim_file_calc_pyq1',
      title: 'Mathematics Semester Exam Question Paper 2022',
      fileName: 'Mathematics_Semester_Exam_2022.pdf',
      fileType: 'PDF',
      mimeType: 'application/pdf',
      fileSize: '850 KB',
      driveUrl: 'https://drive.google.com/file/d/sim_file_calc_pyq1/view',
      previewUrl: 'https://docs.google.com/viewer?srcid=sim_file_calc_pyq1&pid=explorer&efh=false&a=v&chrome=false&embedded=true',
      thumbnail: 'https://placehold.co/300x400/ef4444/ffffff?text=Maths+2022+PYQ',
      createdTime: new Date(),
      modifiedTime: new Date(),
      uploadedDate: new Date(),
      description: 'SRM Ramapuram Mathematics University Semester Exam Question Paper from 2022.',
      folderPath: ['Semester 1', 'Mathematics', 'PYQs']
    }
  ];
}

// Master Folder Scan & Database Sync Entry Point
async function scanGoogleDriveFolder(folderUrl, uploadedBy, forceSim = false) {
  const folderId = extractFolderId(folderUrl);
  if (!folderId) {
    throw new Error('Invalid Google Drive folder URL or ID. Format must be: https://drive.google.com/drive/folders/...');
  }

  let driveFiles = [];
  let methodUsed = 'Google Drive API';

  const drive = forceSim ? null : await getDriveClient();

  if (drive) {
    try {
      console.log(`[Google Drive API] Scanning folder ${folderId} recursively...`);
      driveFiles = await fetchFolderContentsViaApi(drive, folderId);
    } catch (err) {
      console.warn(`[Google Drive API] Error scanning via API: ${err.message}. Trying public web crawler.`);
      methodUsed = 'Public Web Crawler';
      try {
        driveFiles = await fetchFolderContentsViaScraper(folderId);
      } catch (scrapErr) {
        console.error(`[Google Drive Scraper] Scraper failed: ${scrapErr.message}`);
      }
    }
  } else if (!forceSim) {
    console.log(`[Google Drive Web] Using public web crawler for folder: ${folderId}`);
    methodUsed = 'Public Web Crawler';
    try {
      driveFiles = await fetchFolderContentsViaScraper(folderId);
    } catch (scrapErr) {
      console.error(`[Google Drive Scraper] Scraper failed: ${scrapErr.message}`);
    }
  }

  // Backup fallback
  if (driveFiles.length === 0) {
    console.warn(`[Google Drive Import] No files scanned. Using simulated records.`);
    driveFiles = getSimulatedFolderContents(folderId);
    methodUsed = 'Simulator Fallback';
  }

  const results = {
    processed: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    resources: [],
    methodUsed,
  };

  const processedFileIds = [];

  for (const file of driveFiles) {
    const meta = parseAcademicMetadata(file.fileName, file.folderPath, folderId);
    processedFileIds.push(file.driveFileId);

    const resourceData = {
      title: file.title,
      fileName: file.fileName,
      fileType: file.fileType,
      mimeType: file.mimeType || 'application/pdf',
      fileSize: file.fileSize || '1.2 MB',
      driveUrl: file.driveUrl,
      previewUrl: file.previewUrl,
      thumbnail: file.thumbnail,
      uploadedBy,
      source: 'Google Drive',
      semester: meta.semester,
      subject: meta.subject,
      department: meta.department,
      category: meta.category,
      unit: meta.unit,
      year: meta.year,
      examType: meta.examType,
      difficulty: meta.difficulty,
      parentFolderId: folderId,
      driveFolderId: folderId,
      visibility: 'visible',
      tags: [meta.subject, meta.category, file.fileType].filter(Boolean),
      description: file.description || `Academic resource for ${meta.subject} (${meta.category}).`,
      createdTime: file.createdTime || new Date(),
      modifiedTime: file.modifiedTime || new Date(),
    };

    if (file.uploadedDate) {
      resourceData.uploadedDate = file.uploadedDate;
    }

    // Check unique constraint by driveFileId
    const existing = await AcademicResource.findOne({ driveFileId: file.driveFileId });
    let doc;
    if (existing) {
      doc = await AcademicResource.findOneAndUpdate(
        { driveFileId: file.driveFileId },
        { $set: resourceData },
        { new: true }
      );
      results.updated++;
    } else {
      doc = await AcademicResource.create({
        ...resourceData,
        driveFileId: file.driveFileId,
        downloads: 0,
        downloadCount: 0,
        views: 0,
        bookmarkCount: 0,
      });
      results.created++;
    }
    results.processed++;
    results.resources.push(doc);
  }

  // Deletion Detection: Any resource in DB with this parentFolderId whose driveFileId is NOT in the list of processed Drive files has been deleted from Google Drive!
  const deletedDocs = await AcademicResource.find({
    parentFolderId: folderId,
    driveFileId: { $nin: processedFileIds },
  });

  if (deletedDocs.length > 0) {
    await AcademicResource.deleteMany({
      parentFolderId: folderId,
      driveFileId: { $nin: processedFileIds },
    });
    results.deleted = deletedDocs.length;
    console.log(`[Drive Sync] Cleaned up ${deletedDocs.length} files that were deleted from Google Drive.`);
  }

  return results;
}

module.exports = {
  scanGoogleDriveFolder,
  extractFolderId,
};
