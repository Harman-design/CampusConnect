const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: [true, 'Day of week is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 09:00)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 09:50)'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    classroom: {
      type: String,
      default: 'TBD',
      trim: true,
    },
  },
  { timestamps: true }
);

timetableSlotSchema.index({ department: 1, semester: 1, dayOfWeek: 1 });

module.exports = mongoose.model('TimetableSlot', timetableSlotSchema);
