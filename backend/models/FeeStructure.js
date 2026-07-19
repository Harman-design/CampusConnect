const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
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
    academicFee: {
      type: Number,
      required: [true, 'Academic Fee is required'],
      min: 0,
    },
    hostelFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    transportFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due Date is required'],
    },
    lateFinePerDay: {
      type: Number,
      default: 100,
      min: 0,
    },
  },
  { timestamps: true }
);

feeStructureSchema.index({ department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
