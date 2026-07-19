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

const chatValidation = [
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 4000 }),
  body('history').optional().isArray().withMessage('history must be an array'),
  body('history.*.role').optional().isIn(['user', 'model']),
  body('history.*.content').optional().isString(),
  validate,
];

const summarizeValidation = [
  body('text').trim().notEmpty().withMessage('Text to summarize is required').isLength({ max: 20000 }),
  body('length').optional().isIn(['short', 'medium', 'detailed']),
  validate,
];

const quizValidation = [
  body('topic').trim().notEmpty().withMessage('Topic is required').isLength({ max: 200 }),
  body('text').optional().trim().isLength({ max: 20000 }),
  body('numQuestions').optional().isInt({ min: 1, max: 20 }).withMessage('numQuestions must be between 1 and 20'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  validate,
];

const vivaValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('topic').optional().trim().isLength({ max: 200 }),
  body('numQuestions').optional().isInt({ min: 1, max: 20 }),
  validate,
];

const pyqAnalysisValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('department').optional().trim().isLength({ max: 100 }),
  body('semester').optional().isInt({ min: 1, max: 10 }),
  validate,
];

const interviewPrepValidation = [
  body('role').trim().notEmpty().withMessage('Target job role is required').isLength({ max: 150 }),
  body('companyName').optional().trim().isLength({ max: 150 }),
  body('jobDescription').optional().trim().isLength({ max: 5000 }),
  validate,
];

const importantQuestionsValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('unit').optional().trim().isLength({ max: 50 }),
  body('text').optional().trim().isLength({ max: 20000 }),
  validate,
];

module.exports = {
  chatValidation,
  summarizeValidation,
  quizValidation,
  vivaValidation,
  pyqAnalysisValidation,
  interviewPrepValidation,
  importantQuestionsValidation,
};
