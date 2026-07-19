const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['academic', 'hostel', 'infrastructure', 'faculty', 'technical', 'other'],
      default: 'other',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'rejected'],
      default: 'open',
    },
    adminResponse: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

complaintSchema.index({ student: 1, status: 1 });
complaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
