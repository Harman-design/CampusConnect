const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['student', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    category: {
      type: String,
      enum: ['account', 'technical', 'billing', 'academic', 'other'],
      default: 'other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    responses: [responseSchema],
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ student: 1, status: 1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema, 'support_tickets');
