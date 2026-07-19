const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['registered', 'cancelled'],
      default: 'registered',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A student can only have one active registration record per event
// (re-registering after cancelling updates the same document rather than duplicating it)
eventRegistrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema, 'event_registrations');
