const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const FineWaiver = require('../models/FineWaiver');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const nodemailer = require('nodemailer');

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

// Helper to calculate late fine dynamically
const calculateLateFine = async (studentId, feeItem, structure) => {
  if (feeItem.status === 'Paid') return 0;
  if (!feeItem.dueDate) return 0;

  // Check if fine is waived
  const waived = await FineWaiver.findOne({ studentId, feeType: feeItem.feeType });
  if (waived) return 0;

  const dueDate = new Date(feeItem.dueDate);
  const now = new Date();
  if (now <= dueDate) return 0;

  const diffTime = Math.abs(now - dueDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const rate = structure ? structure.lateFinePerDay : 100;
  return diffDays * rate;
};

// @route GET /api/fees/student
// Get fee outstanding balances and history for current student
exports.getStudentFees = catchAsync(async (req, res, next) => {
  const student = await User.findById(req.user._id);
  if (!student) {
    return next(new AppError('Student profile not found.', 404));
  }

  // Find structure to see if we should auto-initialize
  const structure = await FeeStructure.findOne({
    department: student.department.toUpperCase(),
    semester: student.semester
  });

  // Auto-initialize fees if structure exists and user has no feeDetails
  if (structure && (!student.feeDetails || student.feeDetails.length === 0)) {
    student.feeDetails = [
      {
        feeType: 'Academic',
        amount: structure.academicFee,
        paidAmount: 0,
        dueDate: structure.dueDate,
        status: 'Unpaid'
      }
    ];

    // If hosteller
    if (student.hostelDetails && (student.hostelDetails.roomNumber || student.hostelDetails.block)) {
      student.feeDetails.push({
        feeType: 'Hostel',
        amount: structure.hostelFee || 80000,
        paidAmount: 0,
        dueDate: structure.dueDate,
        status: 'Unpaid'
      });
    }

    await student.save();
  }

  // Calculate dynamic fines and outstanding totals
  const enrichedFeeDetails = [];
  let totalOutstanding = 0;

  for (const fee of student.feeDetails) {
    const fine = await calculateLateFine(student._id, fee, structure);
    const outstanding = Math.max(0, fee.amount - fee.paidAmount + fine);
    totalOutstanding += outstanding;

    enrichedFeeDetails.push({
      _id: fee._id,
      feeType: fee.feeType,
      amount: fee.amount,
      paidAmount: fee.paidAmount,
      dueDate: fee.dueDate,
      status: fee.status,
      lateFine: fine,
      outstandingAmount: outstanding
    });
  }

  const paymentHistory = await FeePayment.find({ studentId: student._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      student: {
        name: student.name,
        email: student.email,
        registerNumber: student.registerNumber,
        department: student.department,
        semester: student.semester
      },
      feeDetails: enrichedFeeDetails,
      totalOutstanding,
      paymentHistory
    }
  });
});

// @route POST /api/fees/checkout
// Create Razorpay Order
exports.createCheckoutOrder = catchAsync(async (req, res, next) => {
  const { feeType } = req.body;
  if (!feeType) {
    return next(new AppError('Please specify the fee type to pay.', 400));
  }

  const student = await User.findById(req.user._id);
  const feeItem = student.feeDetails.find(f => f.feeType === feeType);
  if (!feeItem) {
    return next(new AppError('No fee details found for the requested type.', 404));
  }

  if (feeItem.status === 'Paid') {
    return next(new AppError('Fee is already paid in full.', 400));
  }

  const structure = await FeeStructure.findOne({
    department: student.department.toUpperCase(),
    semester: student.semester
  });

  const fine = await calculateLateFine(student._id, feeItem, structure);
  const outstanding = Math.max(0, feeItem.amount - feeItem.paidAmount);
  const amountToPay = outstanding + fine;

  if (amountToPay <= 0) {
    return next(new AppError('Outstanding amount is zero.', 400));
  }

  // Call Razorpay API
  const options = {
    amount: Math.round(amountToPay * 100), // in paise
    currency: 'INR',
    receipt: `rcpt_${student.registerNumber}_${feeType.toLowerCase()}_${Date.now()}`
  };

  const order = await razorpay.orders.create(options);

  // Store pending payment record
  await FeePayment.create({
    studentId: student._id,
    orderId: order.id,
    feeType,
    amount: outstanding,
    finePaid: fine,
    status: 'Pending',
    method: 'Razorpay'
  });

  res.status(200).json({
    success: true,
    orderId: order.id,
    amount: options.amount,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    student: {
      name: student.name,
      email: student.email,
      registerNumber: student.registerNumber
    }
  });
});

// @route POST /api/fees/verify
// Verify payment signature and capture payment
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Missing payment parameters.', 400));
  }

  // Compute signature verification
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret');
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Cryptographic payment signature mismatch. Tampering detected.', 400));
  }

  const payment = await FeePayment.findOne({ orderId: razorpay_order_id, status: 'Pending' });
  if (!payment) {
    return next(new AppError('Matching pending payment order not found or already verified.', 404));
  }

  // Update payment status
  payment.paymentId = razorpay_payment_id;
  payment.signature = razorpay_signature;
  payment.status = 'Success';
  payment.receiptUrl = `/api/fees/receipt/${payment._id}`;
  await payment.save();

  // Update student feeDetails paid balance
  const student = await User.findById(payment.studentId);
  if (student) {
    const feeItem = student.feeDetails.find(f => f.feeType === payment.feeType);
    if (feeItem) {
      feeItem.paidAmount += payment.amount;
      if (feeItem.paidAmount >= feeItem.amount) {
        feeItem.status = 'Paid';
      } else {
        feeItem.status = 'Partial';
      }
      await student.save();
    }
  }

  // Optional: trigger email receipt in background
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });

    const mailOptions = {
      from: '"SRM CampusConnect" <no-reply@srmist.edu.in>',
      to: student.email,
      subject: `Payment Receipt Received: ${payment.feeType} Fee`,
      text: `Hello ${student.name},\n\nWe have received your payment of INR ${payment.amount + payment.finePaid} for ${payment.feeType} Fee.\n\nOrder ID: ${payment.orderId}\nPayment ID: ${payment.paymentId}\n\nYou can download the receipt directly inside the student portal dashboard.\n\nRegards,\nSRM Ramapuram Accounts Office`
    };
    await transporter.sendMail(mailOptions);
  } catch (emailErr) {
    console.warn('[SMTP Email Receipt Failed]', emailErr.message);
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified and credited successfully.',
    receiptUrl: payment.receiptUrl
  });
});

// @route POST /api/fees/webhook
// Razorpay Server Webhook state convergence
exports.handleWebhook = catchAsync(async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_placeholder';
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return next(new AppError('Invalid webhook signature.', 401));
  }

  const event = req.body.event;
  if (event === 'payment.captured') {
    const paymentEntity = req.body.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    const payment = await FeePayment.findOne({ orderId, status: 'Pending' });
    if (payment) {
      payment.paymentId = paymentId;
      payment.status = 'Success';
      payment.receiptUrl = `/api/fees/receipt/${payment._id}`;
      await payment.save();

      const student = await User.findById(payment.studentId);
      if (student) {
        const feeItem = student.feeDetails.find(f => f.feeType === payment.feeType);
        if (feeItem) {
          feeItem.paidAmount += payment.amount;
          feeItem.status = feeItem.paidAmount >= feeItem.amount ? 'Paid' : 'Partial';
          await student.save();
        }
      }
    }
  }

  res.status(200).json({ status: 'ok' });
});

// @route GET /api/fees/receipt/:paymentId
// Generate and download PDF receipt
exports.generateReceiptPdf = catchAsync(async (req, res, next) => {
  const payment = await FeePayment.findById(req.params.paymentId).populate('studentId');
  if (!payment) {
    return next(new AppError('Payment record not found.', 404));
  }

  const student = payment.studentId;

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.paymentId}.pdf`);

  doc.pipe(res);

  // Header Banner
  doc.rect(0, 0, 612, 110).fill('#0B1220');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('SRM INSTITUTE OF SCIENCE & TECHNOLOGY', 50, 30);
  doc.fontSize(11).font('Helvetica').text('Ramapuram Campus, Chennai. Accounts Department Office', 50, 60);

  // Receipt details block
  doc.fillColor('#1E293B').fontSize(16).font('Helvetica-Bold').text('FEE PAYMENT RECEIPT', 50, 140);
  doc.fontSize(10).font('Helvetica').text(`Date generated: ${new Date().toLocaleDateString()}`, 50, 160);
  doc.moveDown();

  doc.rect(50, 180, 512, 1).fill('#CBD5E1');

  // Student Section
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('Student Particulars', 50, 200);
  doc.font('Helvetica').fillColor('#475569');
  doc.text(`Name: ${student ? student.name : 'Unknown Student'}`, 60, 220);
  doc.text(`Register Number: ${student ? student.registerNumber : 'N/A'}`, 60, 235);
  doc.text(`Department: ${student ? student.department : 'N/A'}`, 60, 250);
  doc.text(`Semester: ${student ? student.semester : 'N/A'}`, 60, 265);

  // Transaction Block
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('Transaction Details', 300, 200);
  doc.font('Helvetica').fillColor('#475569');
  doc.text(`Order ID: ${payment.orderId}`, 310, 220);
  doc.text(`Payment ID: ${payment.paymentId || 'N/A'}`, 310, 235);
  doc.text(`Payment Method: ${payment.method}`, 310, 250);
  doc.text(`Status: SUCCESSFUL`, 310, 265);

  doc.rect(50, 290, 512, 1).fill('#CBD5E1');

  // Details Table Header
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('Description', 60, 310);
  doc.text('Base Amount', 320, 310);
  doc.text('Late Fine', 420, 310);
  doc.text('Total Paid', 490, 310);

  doc.rect(50, 325, 512, 1).fill('#E2E8F0');

  // Row Item
  doc.font('Helvetica').fillColor('#334155');
  doc.text(`${payment.feeType} Fee Settlement`, 60, 340);
  doc.text(`INR ${payment.amount.toLocaleString()}`, 320, 340);
  doc.text(`INR ${payment.finePaid.toLocaleString()}`, 420, 340);
  doc.text(`INR ${(payment.amount + payment.finePaid).toLocaleString()}`, 490, 340);

  doc.rect(50, 365, 512, 1).fill('#94A3B8');

  // Total Summary
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0F172A').text('Amount Received In Words:', 50, 390);
  doc.fontSize(10).font('Helvetica-Oblique').fillColor('#475569').text(`Rupees ${(payment.amount + payment.finePaid).toLocaleString()} Only.`, 50, 410);

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E3A8A').text(`GRAND TOTAL: INR ${(payment.amount + payment.finePaid).toLocaleString()}`, 340, 390);

  // Footer seal
  doc.rect(50, 500, 512, 1).fill('#CBD5E1');
  doc.fontSize(9).font('Helvetica').fillColor('#94A3B8').text('This is a computer generated system receipt. No physical signature is required.', 50, 520, { align: 'center', width: 512 });

  doc.end();
});

// @route GET /api/fees/parent-lookup
// Search student details for parent portals
exports.getParentLookup = catchAsync(async (req, res, next) => {
  const { registerNumber, email } = req.query;
  if (!registerNumber || !email) {
    return next(new AppError('Please provide Register Number and Email.', 400));
  }

  const student = await User.findOne({
    registerNumber: registerNumber.trim(),
    email: email.toLowerCase().trim()
  });

  if (!student) {
    return next(new AppError('No student matched the Register Number & Email.', 404));
  }

  // Load structures
  const structure = await FeeStructure.findOne({
    department: student.department.toUpperCase(),
    semester: student.semester
  });

  const enrichedFeeDetails = [];
  let totalOutstanding = 0;

  for (const fee of student.feeDetails) {
    const fine = await calculateLateFine(student._id, fee, structure);
    const outstanding = Math.max(0, fee.amount - fee.paidAmount + fine);
    totalOutstanding += outstanding;

    enrichedFeeDetails.push({
      _id: fee._id,
      feeType: fee.feeType,
      amount: fee.amount,
      paidAmount: fee.paidAmount,
      dueDate: fee.dueDate,
      status: fee.status,
      lateFine: fine,
      outstandingAmount: outstanding
    });
  }

  res.status(200).json({
    success: true,
    data: {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        registerNumber: student.registerNumber,
        department: student.department,
        semester: student.semester
      },
      feeDetails: enrichedFeeDetails,
      totalOutstanding
    }
  });
});

// @route POST /api/fees/parent-checkout
// Checkout Order for parent (bypassing auth middleware by requiring studentId in body)
exports.createParentCheckoutOrder = catchAsync(async (req, res, next) => {
  const { studentId, feeType } = req.body;
  if (!studentId || !feeType) {
    return next(new AppError('Missing studentId or feeType parameters.', 400));
  }

  const student = await User.findById(studentId);
  if (!student) {
    return next(new AppError('Student profile not found.', 404));
  }

  const feeItem = student.feeDetails.find(f => f.feeType === feeType);
  if (!feeItem) {
    return next(new AppError('Fee details not found.', 404));
  }

  const structure = await FeeStructure.findOne({
    department: student.department.toUpperCase(),
    semester: student.semester
  });

  const fine = await calculateLateFine(student._id, feeItem, structure);
  const outstanding = Math.max(0, feeItem.amount - feeItem.paidAmount);
  const amountToPay = outstanding + fine;

  if (amountToPay <= 0) {
    return next(new AppError('Outstanding amount is zero.', 400));
  }

  const options = {
    amount: Math.round(amountToPay * 100),
    currency: 'INR',
    receipt: `rcpt_prnt_${student.registerNumber}_${feeType.toLowerCase()}_${Date.now()}`
  };

  const order = await razorpay.orders.create(options);

  await FeePayment.create({
    studentId: student._id,
    orderId: order.id,
    feeType,
    amount: outstanding,
    finePaid: fine,
    status: 'Pending',
    method: 'Razorpay (Parent)'
  });

  res.status(200).json({
    success: true,
    orderId: order.id,
    amount: options.amount,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    student: {
      name: student.name,
      email: student.email,
      registerNumber: student.registerNumber
    }
  });
});

// ==========================================
// ADMIN ACTIONS
// ==========================================

// @route GET /api/fees/admin/structures
exports.getAdminFeeStructures = catchAsync(async (req, res, next) => {
  const structures = await FeeStructure.find({}).sort({ semester: 1 });
  res.status(200).json({
    success: true,
    data: structures
  });
});

// @route POST /api/fees/admin/structures
exports.createAdminFeeStructure = catchAsync(async (req, res, next) => {
  const { department, semester, academicFee, hostelFee, transportFee, dueDate, lateFinePerDay } = req.body;

  const structure = await FeeStructure.create({
    department,
    semester,
    academicFee,
    hostelFee,
    transportFee,
    dueDate,
    lateFinePerDay
  });

  res.status(201).json({
    success: true,
    message: 'Fee Structure created successfully.',
    data: structure
  });
});

// @route PUT /api/fees/admin/structures/:id
exports.updateAdminFeeStructure = catchAsync(async (req, res, next) => {
  const structure = await FeeStructure.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!structure) {
    return next(new AppError('Structure record not found.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Fee Structure updated successfully.',
    data: structure
  });
});

// @route POST /api/fees/admin/assign
// Admin manual override to assign transport or custom hostel fee to student feeDetails
exports.assignFeesToStudent = catchAsync(async (req, res, next) => {
  const { studentId, feeType, amount, dueDate } = req.body;
  if (!studentId || !feeType || !amount) {
    return next(new AppError('Please provide studentId (or Register Number), feeType and amount.', 400));
  }

  const mongoose = require('mongoose');
  let student;
  if (mongoose.Types.ObjectId.isValid(studentId)) {
    student = await User.findById(studentId);
  }
  if (!student) {
    student = await User.findOne({ registerNumber: studentId.trim() });
  }

  if (!student) {
    return next(new AppError('Student profile not found by ID or Register Number.', 404));
  }

  const existingIndex = student.feeDetails.findIndex(f => f.feeType === feeType);
  if (existingIndex !== -1) {
    student.feeDetails[existingIndex].amount = amount;
    student.feeDetails[existingIndex].dueDate = dueDate || student.feeDetails[existingIndex].dueDate;
    student.feeDetails[existingIndex].status = student.feeDetails[existingIndex].paidAmount >= amount ? 'Paid' : 'Partial';
  } else {
    student.feeDetails.push({
      feeType,
      amount,
      paidAmount: 0,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // default 30 days
      status: 'Unpaid'
    });
  }

  await student.save();

  res.status(200).json({
    success: true,
    message: `${feeType} fee assigned to student successfully.`,
    data: student.feeDetails
  });
});

// @route POST /api/fees/admin/waive-fine
// Register a fine waiver for student & fee type
exports.waiveLateFine = catchAsync(async (req, res, next) => {
  const { studentId, feeType } = req.body;
  if (!studentId || !feeType) {
    return next(new AppError('Missing studentId (or Register Number) or feeType values.', 400));
  }

  const mongoose = require('mongoose');
  let student;
  if (mongoose.Types.ObjectId.isValid(studentId)) {
    student = await User.findById(studentId);
  }
  if (!student) {
    student = await User.findOne({ registerNumber: studentId.trim() });
  }

  if (!student) {
    return next(new AppError('Student profile not found by ID or Register Number.', 404));
  }

  const waiver = await FineWaiver.findOneAndUpdate(
    { studentId: student._id, feeType },
    { waivedBy: req.user._id },
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    message: `Late fine for ${feeType} waived successfully.`,
    data: waiver
  });
});

// @route GET /api/fees/admin/analytics
// Collection overview totals and reports
exports.getAdminAnalytics = catchAsync(async (req, res, next) => {
  const payments = await FeePayment.find({ status: 'Success' });
  const users = await User.find({ role: 'student' });

  let totalCollected = 0;
  let fineCollected = 0;
  
  for (const pay of payments) {
    totalCollected += (pay.amount + pay.finePaid);
    fineCollected += pay.finePaid;
  }

  let totalOutstanding = 0;
  for (const user of users) {
    for (const f of user.feeDetails) {
      if (f.status !== 'Paid') {
        const structure = await FeeStructure.findOne({
          department: user.department.toUpperCase(),
          semester: user.semester
        });
        const fine = await calculateLateFine(user._id, f, structure);
        totalOutstanding += Math.max(0, f.amount - f.paidAmount + fine);
      }
    }
  }

  // Group payments by feeType
  const byType = { Academic: 0, Hostel: 0, Transport: 0 };
  for (const pay of payments) {
    if (byType[pay.feeType] !== undefined) {
      byType[pay.feeType] += pay.amount;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      totalCollected,
      fineCollected,
      totalOutstanding,
      byType,
      transactionsCount: payments.length
    }
  });
});
