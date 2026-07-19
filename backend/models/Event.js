const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 3000,
    },
    category: {
      type: String,
      enum: ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'hackathon', 'college', 'other'],
      default: 'other',
    },
    venue: {
      type: String,
      trim: true,
      default: '',
    },
    startAt: {
      type: Date,
      required: [true, 'Event start date/time is required'],
    },
    endAt: {
      type: Date,
      default: null,
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    capacity: {
      type: Number,
      min: 0,
      default: 0, // 0 = unlimited
    },
    imageUrl: {
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

eventSchema.index({ startAt: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
