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

const broadcastValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  body('type').optional().isIn(['notes', 'pyq', 'placement', 'event', 'announcement']),
  body('target')
    .custom((value) => Array.isArray(value) || ['all', 'students', 'admins'].includes(value))
    .withMessage('target must be "all", "students", "admins", or an array of user ids'),
  body('link').optional().trim(),
  validate,
];

module.exports = { broadcastValidation };
