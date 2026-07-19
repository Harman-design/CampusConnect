const Pyq = require('../models/Pyq');
const catchAsync = require('../utils/catchAsync');
const geminiService = require('../services/geminiService');

const SYSTEM_PERSONA =
  'You are CampusConnect AI, a helpful study assistant for engineering students at SRM Ramapuram College. ' +
  'Be accurate, concise, and encouraging. When you are not confident about a fact, say so instead of guessing.';

// @route POST /api/ai/chat
exports.chat = catchAsync(async (req, res) => {
  const { message, history = [] } = req.body;
  const reply = await geminiService.chat(history, message, SYSTEM_PERSONA);
  res.status(200).json({ success: true, data: { reply } });
});

// @route POST /api/ai/summarize
exports.summarize = catchAsync(async (req, res) => {
  const { text, length = 'medium' } = req.body;

  const lengthGuide = {
    short: 'in 3-4 bullet points',
    medium: 'in a short paragraph plus 5-6 key points',
    detailed: 'in 2-3 paragraphs plus a thorough list of key points',
  }[length];

  const systemInstruction =
    `${SYSTEM_PERSONA} Summarize study notes for exam revision. Respond ONLY with JSON matching this shape: ` +
    `{ "summary": string, "keyPoints": string[] }. Summarize ${lengthGuide}.`;

  const result = await geminiService.generateJSON(systemInstruction, text);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/quiz
exports.generateQuiz = catchAsync(async (req, res) => {
  const { topic, text = '', numQuestions = 5, difficulty = 'medium' } = req.body;

  const systemInstruction =
    `${SYSTEM_PERSONA} Generate a multiple-choice quiz for exam practice. Respond ONLY with JSON matching this shape: ` +
    `{ "questions": [ { "question": string, "options": string[4], "correctAnswerIndex": number, "explanation": string } ] }. ` +
    `Generate exactly ${numQuestions} questions at ${difficulty} difficulty.`;

  const userPrompt = text
    ? `Topic: ${topic}\n\nReference material:\n${text}`
    : `Topic: ${topic}\n\n(No reference material provided — use your general knowledge of this subject.)`;

  const result = await geminiService.generateJSON(systemInstruction, userPrompt);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/viva
exports.generateVivaQuestions = catchAsync(async (req, res) => {
  const { subject, topic = '', numQuestions = 8 } = req.body;

  const systemInstruction =
    `${SYSTEM_PERSONA} Generate oral viva/lab examination questions with model answers. Respond ONLY with JSON matching this shape: ` +
    `{ "questions": [ { "question": string, "modelAnswer": string } ] }. Generate exactly ${numQuestions} questions, ` +
    'ranging from fundamental concepts to more probing follow-up questions.';

  const userPrompt = `Subject: ${subject}${topic ? `\nTopic/Unit: ${topic}` : ''}`;

  const result = await geminiService.generateJSON(systemInstruction, userPrompt);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/pyq-analysis
exports.analyzePyqs = catchAsync(async (req, res) => {
  const { subject, department, semester } = req.body;

  // Pull real PYQ metadata from the database (not mock data) to ground the analysis
  const filter = { subject: new RegExp(subject, 'i') };
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);

  const pyqs = await Pyq.find(filter).select('year examType').sort({ year: -1 }).limit(50);

  const examTypeCounts = pyqs.reduce((acc, p) => {
    acc[p.examType] = (acc[p.examType] || 0) + 1;
    return acc;
  }, {});
  const years = [...new Set(pyqs.map((p) => p.year))].sort((a, b) => b - a);

  const systemInstruction =
    `${SYSTEM_PERSONA} Analyze previous-year-question patterns to help a student prioritize revision. ` +
    'Respond ONLY with JSON matching this shape: { "likelyImportantTopics": string[], "examPatternInsights": string, "recommendation": string }. ' +
    'Base your analysis on general knowledge of how this subject is typically examined, combined with the record counts provided — ' +
    'be upfront in "examPatternInsights" if the record count is too low to draw a strong statistical conclusion.';

  const userPrompt =
    `Subject: ${subject}\n` +
    `PYQ records available in CampusConnect for this subject: ${pyqs.length} (across years: ${years.join(', ') || 'none on file'})\n` +
    `Breakdown by exam type: ${JSON.stringify(examTypeCounts)}`;

  const result = await geminiService.generateJSON(systemInstruction, userPrompt);
  res.status(200).json({ success: true, data: { ...result, recordsAnalyzed: pyqs.length } });
});

// @route POST /api/ai/interview-prep
exports.interviewPrep = catchAsync(async (req, res) => {
  const { role, companyName = '', jobDescription = '' } = req.body;

  const systemInstruction =
    `${SYSTEM_PERSONA} Prepare a student for a job interview. Respond ONLY with JSON matching this shape: ` +
    '{ "technicalQuestions": string[], "hrQuestions": string[], "tips": string[] }. ' +
    'Provide 8-10 technical questions relevant to the role, 5-6 common HR/behavioral questions, and 4-5 practical tips.';

  const userPrompt =
    `Target role: ${role}` +
    (companyName ? `\nCompany: ${companyName}` : '') +
    (jobDescription ? `\nJob description:\n${jobDescription}` : '');

  const result = await geminiService.generateJSON(systemInstruction, userPrompt);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/important-questions
exports.generateImportantQuestions = catchAsync(async (req, res) => {
  const { subject, unit = '', text = '' } = req.body;

  const systemInstruction =
    `${SYSTEM_PERSONA} Predict the most likely important exam questions for focused revision. Respond ONLY with JSON matching this shape: ` +
    '{ "questions": [ { "question": string, "importance": "high"|"medium"|"low", "reason": string } ] }. Generate 8-12 questions.';

  const userPrompt = `Subject: ${subject}${unit ? `\nUnit: ${unit}` : ''}${text ? `\n\nReference material:\n${text}` : ''}`;

  const result = await geminiService.generateJSON(systemInstruction, userPrompt);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/roadmap
exports.generateRoadmap = catchAsync(async (req, res) => {
  const { topic } = req.body;
  const systemInstruction =
    `${SYSTEM_PERSONA} Generate a step-by-step career/subject learning roadmap. Respond ONLY with JSON matching this shape: ` +
    `{ "title": string, "steps": [ { "phase": string, "topics": string[], "resources": string[] } ] }.`;

  const result = await geminiService.generateJSON(systemInstruction, `Topic: ${topic}`);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/study-planner
exports.generateStudyPlan = catchAsync(async (req, res) => {
  const { examName, timeRemaining, subjects = [] } = req.body;
  const systemInstruction =
    `${SYSTEM_PERSONA} Generate a revision study plan for exam preparation. Respond ONLY with JSON matching this shape: ` +
    `{ "schedule": [ { "day": string, "topicsToCover": string[], "hours": number } ], "tips": string[] }.`;

  const prompt = `Exam: ${examName}\nTime Remaining: ${timeRemaining}\nSubjects: ${subjects.join(', ')}`;
  const result = await geminiService.generateJSON(systemInstruction, prompt);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/code-explainer
exports.explainCode = catchAsync(async (req, res) => {
  const { code } = req.body;
  const systemInstruction =
    `${SYSTEM_PERSONA} Explain the provided programming code snippet in detail. Respond ONLY with JSON matching this shape: ` +
    `{ "language": string, "explanation": string, "complexity": { "time": string, "space": string }, "keyTakeaways": string[] }.`;

  const result = await geminiService.generateJSON(systemInstruction, code);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/code-debugger
exports.debugCode = catchAsync(async (req, res) => {
  const { code } = req.body;
  const systemInstruction =
    `${SYSTEM_PERSONA} Analyze the provided programming code for bugs, logic errors, and security issues. Respond ONLY with JSON matching this shape: ` +
    `{ "hasBugs": boolean, "bugs": [ { "line": number, "issue": string, "fix": string } ], "correctedCode": string }.`;

  const result = await geminiService.generateJSON(systemInstruction, code);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/flashcards
exports.generateFlashcards = catchAsync(async (req, res) => {
  const { topic, numCards = 6 } = req.body;
  const systemInstruction =
    `${SYSTEM_PERSONA} Generate interactive study flashcards for active recall practice. Respond ONLY with JSON matching this shape: ` +
    `{ "flashcards": [ { "front": string, "back": string } ] }. Generate exactly ${numCards} flashcards.`;

  const result = await geminiService.generateJSON(systemInstruction, `Topic: ${topic}`);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/notes-generator
exports.generateNotes = catchAsync(async (req, res) => {
  const { subject, topic } = req.body;
  const systemInstruction =
    `${SYSTEM_PERSONA} Generate structured revision study notes for a given academic subject and topic. Respond ONLY with JSON matching this shape: ` +
    `{ "subject": string, "topic": string, "introduction": string, "sections": [ { "heading": string, "content": string } ], "summary": string }.`;

  const result = await geminiService.generateJSON(systemInstruction, `Subject: ${subject}\nTopic: ${topic}`);
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/resume-review
exports.reviewResume = catchAsync(async (req, res) => {
  const { resumeData } = req.body; // structured JSON resume data
  const systemInstruction =
    `${SYSTEM_PERSONA} Provide an ATS-friendly review of a student's resume. Respond ONLY with JSON matching this shape: ` +
    `{ "score": number, "suggestions": string[], "atsKeywords": string[] }.`;

  const result = await geminiService.generateJSON(systemInstruction, JSON.stringify(resumeData));
  res.status(200).json({ success: true, data: result });
});

// @route POST /api/ai/analyze-resume-job
exports.analyzeResumeJob = catchAsync(async (req, res) => {
  const { resumeData, jobDescription } = req.body;
  const systemInstruction =
    `${SYSTEM_PERSONA} Provide a match score and professional feedback comparing a student's resume details to a target Job Description. Respond ONLY with JSON matching this shape: ` +
    `{ "fitScore": number, "matchingSkills": string[], "missingSkills": string[], "recommendations": string }.`;

  const prompt = `Resume:\n${JSON.stringify(resumeData)}\n\nJob Description:\n${jobDescription}`;
  const result = await geminiService.generateJSON(systemInstruction, prompt);
  res.status(200).json({ success: true, data: result });
});

