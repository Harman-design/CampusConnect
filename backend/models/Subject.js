const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 10,
    },
    credits: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

subjectSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
