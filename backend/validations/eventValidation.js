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

const CATEGORIES = ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'other'];

const createEventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('category').optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('venue').optional().trim(),
  body('startAt').notEmpty().withMessage('Start date/time is required').isISO8601().withMessage('Must be a valid date'),
  body('endAt').optional().isISO8601(),
  body('registrationDeadline').optional().isISO8601(),
  body('capacity').optional().isInt({ min: 0 }),
  body('imageUrl').optional().trim().isURL().withMessage('imageUrl must be a valid URL'),
  validate,
];

const updateEventValidation = [
  param('id').isMongoId().withMessage('Invalid event id'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('category').optional().isIn(CATEGORIES),
  body('venue').optional().trim(),
  body('startAt').optional().isISO8601(),
  body('endAt').optional().isISO8601(),
  body('registrationDeadline').optional().isISO8601(),
  body('capacity').optional().isInt({ min: 0 }),
  validate,
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid id'), validate];

module.exports = { createEventValidation, updateEventValidation, idParamValidation, CATEGORIES };
