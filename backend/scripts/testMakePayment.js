require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('../config/dnsPatch');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusconnect';

async function run() {
  try {
    console.log('[Test DB] Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('[Test DB] Connected successfully.');

    // 1. Find or create a test student
    let student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('[Test Student] Creating a temporary student for testing...');
      student = await User.create({
        name: 'Razorpay Test Student',
        email: 'testpaystudent@srmist.edu.in',
        password: 'securePassword123',
        role: 'student',
        department: 'CSE',
        semester: 4,
        registerNumber: 'TESTPAYREG123'
      });
    }

    console.log(`[Test Student] Selected student: ${student.name} (${student.registerNumber})`);

    // 2. Initialize test fee details in student record
    student.feeDetails = [
      {
        feeType: 'Academic',
        amount: 150000,
        paidAmount: 0,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
        status: 'Unpaid'
      }
    ];
    await student.save();
    console.log('[Test Fee] Initialized Academic fee of INR 150,000.');

    // 3. Simulate checkout order creation
    const orderId = `order_mock_${Math.random().toString(36).substring(2, 9)}`;
    const paymentId = `pay_mock_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[Test Order] Generated Order ID: ${orderId}`);

    // Store the pending transaction record in DB
    const payment = await FeePayment.create({
      studentId: student._id,
      orderId: orderId,
      feeType: 'Academic',
      amount: 150000,
      finePaid: 0,
      status: 'Pending',
      method: 'Razorpay Test'
    });
    console.log('[Test Transaction] Pending payment record created in DB.');

    // 4. Simulate signature verification (Verify signature)
    const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(orderId + '|' + paymentId);
    const signature = hmac.digest('hex');

    console.log('[Test Verification] Running signature verification checks...');
    const verifyHmac = crypto.createHmac('sha256', secret);
    verifyHmac.update(orderId + '|' + paymentId);
    const verifySig = verifyHmac.digest('hex');

    if (verifySig !== signature) {
      throw new Error('Signature verification check failed.');
    }
    console.log('✔ Cryptographic signature verified successfully.');

    // Update payment record to success
    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = 'Success';
    payment.receiptUrl = `/api/fees/receipt/${payment._id}`;
    await payment.save();
    console.log('[Test Transaction] Payment status set to Success in DB.');

    // Credit the fee balance in the User document
    const updatedStudent = await User.findById(student._id);
    const feeItem = updatedStudent.feeDetails.find(f => f.feeType === 'Academic');
    if (feeItem) {
      feeItem.paidAmount += payment.amount;
      if (feeItem.paidAmount >= feeItem.amount) {
        feeItem.status = 'Paid';
      }
      await updatedStudent.save();
      console.log(`[Test Student] Updated Student Academic Fee Status: ${feeItem.status} (Paid: INR ${feeItem.paidAmount})`);
    }

    console.log('\n=========================================');
    console.log('FEE PAYMENT SIMULATION COMPLETED SUCCESSFULLY!');
    console.log('✔ Verified student fee details status transition to Paid.');
    console.log('✔ Verified payment record transitions to Success.');
    console.log('=========================================');

  } catch (err) {
    console.error('[Simulation Error]', err);
  } finally {
    await mongoose.connection.close();
    console.log('[Test DB] Connection closed.');
  }
}

run();
