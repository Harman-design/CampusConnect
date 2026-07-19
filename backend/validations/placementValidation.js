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

const createPlacementValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required').isLength({ max: 150 }),
  body('role').trim().notEmpty().withMessage('Role is required').isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('packageLPA').optional().isFloat({ min: 0 }),
  body('location').optional().trim(),
  body('driveDate').optional().isISO8601().withMessage('Drive date must be a valid date'),
  body('applicationDeadline').notEmpty().withMessage('Application deadline is required').isISO8601().withMessage('Must be a valid date'),
  body('eligibility.minCgpa').optional().isFloat({ min: 0, max: 10 }),
  body('eligibility.maxBacklogs').optional().isInt({ min: 0 }),
  body('eligibility.allowedDepartments').optional().isArray().withMessage('allowedDepartments must be an array'),
  body('eligibility.graduationYear').optional().isInt({ min: 2000, max: 2100 }),
  body('status').optional().isIn(['upcoming', 'ongoing', 'closed']),
  validate,
];

const updatePlacementValidation = [
  param('id').isMongoId().withMessage('Invalid placement id'),
  body('companyName').optional().trim().isLength({ max: 150 }),
  body('role').optional().trim().isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 3000 }),
  body('packageLPA').optional().isFloat({ min: 0 }),
  body('applicationDeadline').optional().isISO8601(),
  body('driveDate').optional().isISO8601(),
  body('status').optional().isIn(['upcoming', 'ongoing', 'closed']),
  validate,
];

const updateApplicationStatusValidation = [
  param('id').isMongoId().withMessage('Invalid application id'),
  body('status').notEmpty().isIn(['applied', 'shortlisted', 'rejected', 'selected']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 1000 }),
  validate,
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid id'), validate];

module.exports = {
  createPlacementValidation,
  updatePlacementValidation,
  updateApplicationStatusValidation,
  idParamValidation,
};
