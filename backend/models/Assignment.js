const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 3000,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
    },
    fileUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

assignmentSchema.index({ department: 1, semester: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
