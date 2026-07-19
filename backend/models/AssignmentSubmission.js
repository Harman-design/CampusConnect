const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'Submission file URL is required'],
    },
    fileName: {
      type: String,
      default: 'submission.pdf',
    },
    status: {
      type: String,
      enum: ['Submitted', 'Late', 'Graded'],
      default: 'Submitted',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: String,
      trim: true,
      default: '',
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
