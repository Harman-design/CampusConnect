const mongoose = require('mongoose');

const fineWaiverSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    feeType: {
      type: String,
      required: [true, 'Fee Type is required'],
    },
    waivedAt: {
      type: Date,
      default: Date.now,
    },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

fineWaiverSchema.index({ studentId: 1, feeType: 1 }, { unique: true });

module.exports = mongoose.model('FineWaiver', fineWaiverSchema);
