const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      trim: true,
    },
    paymentId: {
      type: String,
      trim: true,
    },
    signature: {
      type: String,
      trim: true,
    },
    feeType: {
      type: String,
      required: [true, 'Fee Type is required'],
      enum: ['Academic', 'Hostel', 'Transport'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    finePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Pending',
    },
    method: {
      type: String,
      trim: true,
      default: 'Razorpay',
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeePayment', feePaymentSchema);
