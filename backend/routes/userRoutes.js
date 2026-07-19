const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { updateProfileValidation } = require('../validations/userValidation');

const router = express.Router();

router.use(protect);

router.patch('/profile', updateProfileValidation, userController.updateMyProfile);
const { restrictTo } = require('../middleware/roleCheck');
router.get('/students', restrictTo('faculty', 'admin'), userController.getStudentsForFaculty);

module.exports = router;
