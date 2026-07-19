const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(messages.join('. '), 400));
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Provide a valid email')
    .custom((value) => {
      if (!value.toLowerCase().endsWith('@srmist.edu.in')) {
        throw new Error('Only official SRM Institute email addresses (@srmist.edu.in) are allowed to register.');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('role').optional().isIn(['student', 'faculty', 'admin']).withMessage('Invalid role'),
  body('department').optional().trim().isLength({ max: 100 }),
  body('semester').optional().isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('registerNumber').optional().trim().isLength({ max: 30 }),
  validate,
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const forgotPasswordValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail(),
  validate,
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  validate,
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
};
