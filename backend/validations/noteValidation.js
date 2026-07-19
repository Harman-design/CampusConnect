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

const createNoteMetaValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 150 }),
  body('semester').notEmpty().withMessage('Semester is required').isInt({ min: 1, max: 10 }).withMessage('Semester must be 1-10'),
  body('department').trim().notEmpty().withMessage('Department is required').isLength({ max: 100 }),
  body('unit').optional().trim().isLength({ max: 50 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  validate,
];

const createDriveLinkValidation = [
  ...createNoteMetaValidation.slice(0, -1),
  body('driveLink').trim().notEmpty().withMessage('Drive link is required').isURL().withMessage('Must be a valid URL'),
  validate,
];

const updateNoteValidation = [
  param('id').isMongoId().withMessage('Invalid note id'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('subject').optional().trim().isLength({ max: 150 }),
  body('semester').optional().isInt({ min: 1, max: 10 }),
  body('department').optional().trim().isLength({ max: 100 }),
  body('unit').optional().trim().isLength({ max: 50 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  validate,
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid id'), validate];

module.exports = {
  createNoteMetaValidation,
  createDriveLinkValidation,
  updateNoteValidation,
  idParamValidation,
};
