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

const CATEGORIES = ['account', 'technical', 'billing', 'academic', 'other'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const createTicketValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 3000 }),
  body('category').optional().isIn(CATEGORIES),
  body('priority').optional().isIn(PRIORITIES),
  validate,
];

const addResponseValidation = [
  param('id').isMongoId().withMessage('Invalid ticket id'),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
  validate,
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid ticket id'),
  body('status').notEmpty().isIn(STATUSES).withMessage('Invalid status'),
  validate,
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid id'), validate];

module.exports = { createTicketValidation, addResponseValidation, updateStatusValidation, idParamValidation, CATEGORIES, PRIORITIES, STATUSES };
