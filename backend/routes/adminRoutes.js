const express = require('express');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/audit-logs', adminController.getAuditLogs);

router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSetting);

module.exports = router;
