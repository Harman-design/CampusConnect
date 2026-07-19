const express = require('express');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('faculty', 'admin'), attendanceController.markAttendance);
router.get('/student/me', restrictTo('student'), attendanceController.getStudentAttendance);
router.get('/report', restrictTo('faculty', 'admin'), attendanceController.exportAttendanceReport);

module.exports = router;
