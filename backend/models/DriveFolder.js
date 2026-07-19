const mongoose = require('mongoose');

const driveFolderSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      uppercase: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 10,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'All',
      trim: true,
    },
    driveFolderUrl: {
      type: String,
      required: [true, 'Drive Folder URL is required'],
      trim: true,
    },
    driveFolderId: {
      type: String,
      required: [true, 'Drive Folder ID is required'],
      unique: true,
      trim: true,
    },
    faculty: {
      type: String,
      default: 'SRM Faculty',
      trim: true,
    },
    credits: {
      type: Number,
      default: 4,
      min: 1,
      max: 6,
    },
    lastSyncTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Synced', 'Failed', 'Pending'],
      default: 'Pending',
    },
    importedFiles: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DriveFolder', driveFolderSchema);
