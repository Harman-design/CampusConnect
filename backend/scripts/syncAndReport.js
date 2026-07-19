require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('../config/dnsPatch');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DriveFolder = require('../models/DriveFolder');
const AcademicResource = require('../models/AcademicResource');
const { scanGoogleDriveFolder } = require('../services/driveImportService');

const defaultFolders = [
  {
    department: 'CSE',
    semester: 1,
    subject: 'All Subjects (Sem 1)',
    category: 'All',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1usKtW9XZmMyFgx03vkhQl6TJrXJtI1Cz',
    driveFolderId: '1usKtW9XZmMyFgx03vkhQl6TJrXJtI1Cz',
    faculty: 'SRM Admin',
    credits: 4
  },
  {
    department: 'CSE',
    semester: 4,
    subject: 'All Subjects (Sem 4)',
    category: 'All',
    driveFolderUrl: 'https://drive.google.com/drive/folders/1sL7tOgcblv2Sf206l2RRM3NODhvB0cBY',
    driveFolderId: '1sL7tOgcblv2Sf206l2RRM3NODhvB0cBY',
    faculty: 'SRM Admin',
    credits: 4
  }
];

async function run() {
  try {
    await connectDB();

    console.log('[Seed] Seeding default Google Drive folders...');
    for (const df of defaultFolders) {
      const exists = await DriveFolder.findOne({ driveFolderId: df.driveFolderId });
      if (!exists) {
        await DriveFolder.create(df);
        console.log(`[Seed] Created mapping for Semester ${df.semester}: ${df.driveFolderUrl}`);
      } else {
        console.log(`[Seed] Mapping already exists for Semester ${df.semester}`);
      }
    }

    const allFolders = await DriveFolder.find({});
    console.log(`[Sync] Starting sync of ${allFolders.length} Drive folders...`);

    const syncSummary = [];
    let duplicateFilesSkipped = 0;

    for (const folder of allFolders) {
      try {
        console.log(`[Sync] Crawling folder: ${folder.driveFolderUrl}`);
        folder.status = 'Pending';
        await folder.save();

        const results = await scanGoogleDriveFolder(folder.driveFolderUrl, new mongoose.Types.ObjectId());
        folder.status = 'Synced';
        folder.importedFiles = results.processed;
        folder.lastSyncTime = new Date();
        await folder.save();

        // Calculate duplicates skipped based on crawl statistics or local duplicates
        // Results has created and updated counts. Any updated file acts as a database-level duplicate (merging/updating instead of duplicating)
        duplicateFilesSkipped += results.updated;

        syncSummary.push({
          folderId: folder.driveFolderId,
          semester: folder.semester,
          status: 'Success',
          methodUsed: results.methodUsed,
          filesScanned: results.processed,
          newFilesImported: results.created,
          existingFilesUpdated: results.updated
        });
        console.log(`[Sync Success] Semester ${folder.semester}: Processed ${results.processed} files (Created: ${results.created}, Updated: ${results.updated})`);
      } catch (err) {
        folder.status = 'Failed';
        await folder.save();
        syncSummary.push({
          folderId: folder.driveFolderId,
          semester: folder.semester,
          status: 'Failed',
          error: err.message
        });
        console.error(`[Sync Failed] Semester ${folder.semester}: ${err.message}`);
      }
    }

    // Load all resources in the DB to construct the final report
    const resources = await AcademicResource.find({});

    const semestersSet = new Set(resources.map(r => r.semester));
    const subjectsSet = new Set(resources.map(r => r.subject));

    let notesCount = 0;
    let pyqsCount = 0;
    let assignmentsCount = 0;
    let labManualsCount = 0;
    let booksCount = 0;

    for (const r of resources) {
      const cat = (r.category || '').toLowerCase();
      // Classify folders dynamically matching user specification
      if (['notes', 'lecture ppts', 'slides', 'tutorials', 'syllabus', 'cheat sheets', 'formula sheets', 'tutorial sheets', 'important questions', 'question banks'].includes(cat)) {
        notesCount++;
      } else if (cat === 'previous year questions') {
        pyqsCount++;
      } else if (cat === 'assignments') {
        assignmentsCount++;
      } else if (['lab manuals', 'lab records'].includes(cat)) {
        labManualsCount++;
      } else if (cat === 'reference books') {
        booksCount++;
      } else {
        // Fallback fallback to notes
        notesCount++;
      }
    }

    console.log('\n=========================================');
    console.log('FINAL REPORT');
    console.log('=========================================');
    console.log(`• Number of semesters detected: ${semestersSet.size}`);
    console.log(`• Number of subjects: ${subjectsSet.size}`);
    console.log(`• Number of Notes: ${notesCount}`);
    console.log(`• Number of PYQs: ${pyqsCount}`);
    console.log(`• Number of Assignments: ${assignmentsCount}`);
    console.log(`• Number of Lab Manuals: ${labManualsCount}`);
    console.log(`• Number of Books: ${booksCount}`);
    console.log(`• Duplicate files skipped: ${duplicateFilesSkipped}`);
    console.log('• Sync summary:');
    console.log(JSON.stringify(syncSummary, null, 2));
    console.log('=========================================');

  } catch (err) {
    console.error('[Error during script execution]', err);
  } finally {
    mongoose.connection.close();
  }
}

run();
