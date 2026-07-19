const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const { broadcastValidation } = require('../validations/notificationValidation');

const router = express.Router();

router.use(protect);

router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/mark-all-read', notificationController.markAllAsRead);

router.get('/', notificationController.getMyNotifications);
router.post('/broadcast', restrictTo('admin'), broadcastValidation, notificationController.broadcast);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
