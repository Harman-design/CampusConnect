const mongoose = require('mongoose');

const pyqSchema = new mongoose.Schema(
  {
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
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2000,
      max: 2100,
    },
    examType: {
      type: String,
      required: [true, 'Exam type is required'],
      enum: ['CAT1', 'CAT2', 'CAT3', 'Model', 'Semester', 'Other'],
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
    fileHash: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

pyqSchema.index({ subject: 'text' });
pyqSchema.index({ department: 1, semester: 1, year: -1 });

module.exports = mongoose.model('Pyq', pyqSchema);
