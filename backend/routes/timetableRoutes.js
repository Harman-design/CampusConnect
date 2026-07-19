const express = require('express');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const timetableController = require('../controllers/timetableController');

const router = express.Router();

router.use(protect);

router.get('/', timetableController.getTimetable);
router.post('/', restrictTo('admin'), timetableController.createSlot);
router.put('/:id', restrictTo('admin'), timetableController.updateSlot);
router.delete('/:id', restrictTo('admin'), timetableController.deleteSlot);

module.exports = router;
