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

const updateProfileValidation = [
  body('name').optional().trim().isLength({ max: 100 }),
  body('department').optional().trim().isLength({ max: 100 }),
  body('semester').optional().isInt({ min: 1, max: 10 }),
  body('registerNumber').optional().trim().isLength({ max: 30 }),
  body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('backlogs').optional().isInt({ min: 0 }).withMessage('Backlogs must be 0 or more'),
  body('graduationYear').optional().isInt({ min: 2000, max: 2100 }),
  body('resumeUrl').optional().trim().isURL().withMessage('Resume URL must be valid'),
  validate,
];

module.exports = { updateProfileValidation };
