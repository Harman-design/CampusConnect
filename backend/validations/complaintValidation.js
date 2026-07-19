const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(messages.join('. '), 400));
  }
  next();
};

const CATEGORIES = ['academic', 'hostel', 'infrastructure', 'faculty', 'technical', 'other'];

const createComplaintValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 3000 }),
  body('category').optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  validate,
];

const resolveComplaintValidation = [
  param('id').isMongoId().withMessage('Invalid complaint id'),
  body('status').notEmpty().isIn(['open', 'in_progress', 'resolved', 'rejected']).withMessage('Invalid status'),
  body('adminResponse').optional().trim().isLength({ max: 2000 }),
  validate,
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid id'), validate];

module.exports = { createComplaintValidation, resolveComplaintValidation, idParamValidation, CATEGORIES };
