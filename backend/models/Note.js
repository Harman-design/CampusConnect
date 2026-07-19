const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
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
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'ppt', 'drive_link'],
      required: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    storagePath: {
      // Firebase Storage object path, used for deletion. Empty for drive links.
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    bookmarkedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    fileHash: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

noteSchema.index({ subject: 'text', title: 'text', description: 'text' });
noteSchema.index({ department: 1, semester: 1, subject: 1 });

module.exports = mongoose.model('Note', noteSchema);
