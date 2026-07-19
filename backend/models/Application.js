const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    placement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Placement',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'rejected', 'selected'],
      default: 'applied',
    },
    resumeUrlSnapshot: {
      // captured at time of application, so later resume edits don't retroactively change a submitted application
      type: String,
      default: '',
    },
    notes: {
      // admin-visible notes about this specific application (e.g. interview feedback)
      type: String,
      default: '',
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// A student can only apply once per placement drive
applicationSchema.index({ placement: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
