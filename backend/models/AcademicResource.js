const mongoose = require('mongoose');

const academicResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 150,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 10,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      maxlength: 100,
    },
    unit: {
      type: String,
      trim: true,
      default: '',
      maxlength: 50,
    },
    category: {
      type: String,
      enum: [
        'Notes',
        'Previous Year Questions',
        'Lab Manuals',
        'Lab Records',
        'Assignments',
        'Tutorial Sheets',
        'Formula Sheets',
        'Question Banks',
        'Reference Books',
        'Syllabus',
        'Lecture PPTs',
        'Cheat Sheets',
        'Important Questions'
      ],
      required: true,
    },
    fileType: {
      type: String,
      default: 'PDF',
      trim: true,
      maxlength: 50,
    },
    driveFileId: {
      type: String,
      required: [true, 'Google Drive File ID is required'],
      unique: true,
      trim: true,
    },
    driveUrl: {
      type: String,
      required: [true, 'Google Drive URL is required'],
    },
    previewUrl: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    fileSize: {
      type: String,
      default: '0 KB',
    },
    uploadedDate: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      enum: ['Google Drive', 'The Helper', 'Faculty Upload', 'Admin Upload'],
      default: 'Google Drive',
    },
    parentFolderId: {
      type: String,
      trim: true,
      default: '',
    },
    downloads: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    bookmarkCount: {
      type: Number,
      default: 0,
    },
    bookmarkedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    aiIndexed: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
    // PYQ specific fields
    year: {
      type: Number,
      min: 2000,
      max: 2100,
    },
    examType: {
      type: String,
      enum: ['CAT1', 'CAT2', 'CAT3', 'Model', 'Semester', 'Other'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    mimeType: {
      type: String,
      trim: true,
      default: '',
    },
    driveFolderId: {
      type: String,
      trim: true,
      default: '',
    },
    createdTime: {
      type: Date,
    },
    modifiedTime: {
      type: Date,
    },
    fileHash: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Indexes for global search engine
academicResourceSchema.index({ 
  title: 'text', 
  subject: 'text', 
  unit: 'text',
  tags: 'text' 
});

academicResourceSchema.index({ department: 1, semester: 1, category: 1 });

module.exports = mongoose.model('AcademicResource', academicResourceSchema);
