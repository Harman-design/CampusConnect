const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const {
  chatValidation,
  summarizeValidation,
  quizValidation,
  vivaValidation,
  pyqAnalysisValidation,
  interviewPrepValidation,
  importantQuestionsValidation,
} = require('../validations/aiValidation');

const router = express.Router();

router.use(protect);

const aiLimiter = rateLimit({
  windowMs: (Number(process.env.AI_RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user._id.toString(),
  message: {
    success: false,
    message: 'You have hit the AI assistant rate limit. Please wait a few minutes and try again.',
  },
});

router.use(aiLimiter);

router.post('/chat', chatValidation, aiController.chat);
router.post('/summarize', summarizeValidation, aiController.summarize);
router.post('/quiz', quizValidation, aiController.generateQuiz);
router.post('/viva', vivaValidation, aiController.generateVivaQuestions);
router.post('/pyq-analysis', pyqAnalysisValidation, aiController.analyzePyqs);
router.post('/interview-prep', interviewPrepValidation, aiController.interviewPrep);
router.post('/important-questions', importantQuestionsValidation, aiController.generateImportantQuestions);

// Phase additions
router.post('/roadmap', aiController.generateRoadmap);
router.post('/study-planner', aiController.generateStudyPlan);
router.post('/code-explainer', aiController.explainCode);
router.post('/code-debugger', aiController.debugCode);
router.post('/flashcards', aiController.generateFlashcards);
router.post('/notes-generator', aiController.generateNotes);
router.post('/resume-review', aiController.reviewResume);
router.post('/analyze-resume-job', aiController.analyzeResumeJob);

module.exports = router;
