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

const EXAM_TYPES = ['CAT1', 'CAT2', 'CAT3', 'Model', 'Semester', 'Other'];

const createPyqValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 150 }),
  body('semester').notEmpty().withMessage('Semester is required').isInt({ min: 1, max: 10 }).withMessage('Semester must be 1-10'),
  body('department').trim().notEmpty().withMessage('Department is required').isLength({ max: 100 }),
  body('year').notEmpty().withMessage('Year is required').isInt({ min: 2000, max: 2100 }),
  body('examType').notEmpty().withMessage('Exam type is required').isIn(EXAM_TYPES).withMessage(`Exam type must be one of: ${EXAM_TYPES.join(', ')}`),
  validate,
];

const updatePyqValidation = [
  param('id').isMongoId().withMessage('Invalid PYQ id'),
  body('subject').optional().trim().isLength({ max: 150 }),
  body('semester').optional().isInt({ min: 1, max: 10 }),
  body('department').optional().trim().isLength({ max: 100 }),
  body('year').optional().isInt({ min: 2000, max: 2100 }),
  body('examType').optional().isIn(EXAM_TYPES),
  validate,
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid id'), validate];

module.exports = { createPyqValidation, updatePyqValidation, idParamValidation, EXAM_TYPES };
