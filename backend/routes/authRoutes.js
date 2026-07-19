const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('../validations/authValidation');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: (Number(process.env.AUTH_RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again later.',
  },
});

router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

router.post('/forgot-password', authLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, authController.resetPassword);
router.post('/change-password', protect, changePasswordValidation, authController.changePassword);

module.exports = router;
