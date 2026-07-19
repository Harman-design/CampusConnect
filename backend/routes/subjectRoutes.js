const express = require('express');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const subjectController = require('../controllers/subjectController');

const router = express.Router();

router.use(protect);

router.get('/', subjectController.getSubjects);
router.post('/', restrictTo('admin'), subjectController.createSubject);
router.put('/:id', restrictTo('admin'), subjectController.updateSubject);
router.delete('/:id', restrictTo('admin'), subjectController.deleteSubject);

module.exports = router;
