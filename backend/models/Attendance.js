const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      required: [true, 'Status is required'],
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ department: 1, semester: 1, subject: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
