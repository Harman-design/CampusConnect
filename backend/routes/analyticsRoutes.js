const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/overview', analyticsController.getOverview);
router.get('/downloads', analyticsController.getDownloads);
router.get('/events', analyticsController.getEvents);
router.get('/placements', analyticsController.getPlacements);
router.get('/users', analyticsController.getUsers);

module.exports = router;
