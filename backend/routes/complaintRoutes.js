const express = require('express');
const complaintController = require('../controllers/complaintController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const { createComplaintValidation, resolveComplaintValidation, idParamValidation } = require('../validations/complaintValidation');

const router = express.Router();

router.use(protect);

router.get('/', complaintController.getComplaints);
router.post('/', restrictTo('student'), createComplaintValidation, complaintController.createComplaint);
router.get('/:id', idParamValidation, complaintController.getComplaintById);
router.patch('/:id/resolve', restrictTo('admin'), resolveComplaintValidation, complaintController.resolveComplaint);

module.exports = router;
