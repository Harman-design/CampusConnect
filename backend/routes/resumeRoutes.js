const express = require('express');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const resumeController = require('../controllers/resumeController');

const router = express.Router();

router.use(protect);
router.use(restrictTo('student'));

router.get('/me', resumeController.getMyResume);
router.post('/me', resumeController.saveMyResume);

module.exports = router;
