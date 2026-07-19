const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const assignmentController = require('../controllers/assignmentController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.use(protect);

router.get('/', restrictTo('faculty', 'admin'), assignmentController.getCreatedAssignments);
router.post('/', restrictTo('faculty', 'admin'), upload.single('file'), assignmentController.createAssignment);
router.put('/:id', restrictTo('faculty', 'admin'), upload.single('file'), assignmentController.updateAssignment);
router.delete('/:id', restrictTo('faculty', 'admin'), assignmentController.deleteAssignment);

router.get('/student/me', restrictTo('student'), assignmentController.getStudentAssignments);
router.post('/:id/submit', restrictTo('student'), upload.single('file'), assignmentController.submitAssignment);

router.get('/:id/submissions', restrictTo('faculty', 'admin'), assignmentController.getSubmissions);
router.post('/submissions/:subId/grade', restrictTo('faculty', 'admin'), assignmentController.gradeSubmission);

module.exports = router;
