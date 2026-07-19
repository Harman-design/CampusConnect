const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicResource',
      required: true,
    },
    activityType: {
      type: String,
      enum: ['view', 'download'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast query of recent user logs
userActivitySchema.index({ userId: 1, activityType: 1, timestamp: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
