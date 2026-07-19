const express = require('express');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const feeController = require('../controllers/feeController');

const router = express.Router();

// Webhook endpoint (Public, no auth)
router.post('/webhook', feeController.handleWebhook);

// Parent lookup and parent payment initiation (Public, no auth)
router.get('/parent-lookup', feeController.getParentLookup);
router.post('/parent-checkout', feeController.createParentCheckoutOrder);

// Receipt PDF generation (Public link access)
router.get('/receipt/:paymentId', feeController.generateReceiptPdf);

// Student Authenticated Endpoints
router.get('/student', protect, restrictTo('student'), feeController.getStudentFees);
router.post('/checkout', protect, restrictTo('student'), feeController.createCheckoutOrder);
router.post('/verify', protect, restrictTo('student'), feeController.verifyPayment);

// Admin Authenticated Endpoints
router.get('/admin/structures', protect, restrictTo('admin'), feeController.getAdminFeeStructures);
router.post('/admin/structures', protect, restrictTo('admin'), feeController.createAdminFeeStructure);
router.put('/admin/structures/:id', protect, restrictTo('admin'), feeController.updateAdminFeeStructure);
router.post('/admin/assign', protect, restrictTo('admin'), feeController.assignFeesToStudent);
router.post('/admin/waive-fine', protect, restrictTo('admin'), feeController.waiveLateFine);
router.get('/admin/analytics', protect, restrictTo('admin'), feeController.getAdminAnalytics);

module.exports = router;
