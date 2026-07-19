const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 150,
    },
    role: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 3000,
    },
    packageLPA: {
      type: Number,
      min: 0,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    driveDate: {
      type: Date,
      default: null,
    },
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    eligibility: {
      minCgpa: { type: Number, min: 0, max: 10, default: 0 },
      maxBacklogs: { type: Number, min: 0, default: 999 },
      allowedDepartments: [{ type: String, trim: true }], // empty array = all departments
      graduationYear: { type: Number, default: null }, // null = any
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'closed'],
      default: 'upcoming',
    },
    type: {
      type: String,
      enum: ['placement', 'internship'],
      default: 'placement',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

placementSchema.index({ status: 1, applicationDeadline: 1 });
placementSchema.index({ companyName: 'text', role: 'text' });

module.exports = mongoose.model('Placement', placementSchema);
