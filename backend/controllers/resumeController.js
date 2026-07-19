const Resume = require('../models/Resume');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @route GET /api/resume/me
// Get current user's resume
exports.getMyResume = catchAsync(async (req, res, next) => {
  let resume = await Resume.findOne({ student: req.user._id });
  
  if (!resume) {
    // Return empty resume scaffold so frontend has default fields
    resume = {
      student: req.user._id,
      education: [],
      skills: [],
      experience: [],
      projects: [],
      certificates: [],
      achievements: [],
      languages: [],
      links: { github: '', linkedin: '', portfolio: '' },
    };
  }

  res.status(200).json({
    success: true,
    data: resume,
  });
});

// @route POST /api/resume/me
// Create or Update current user's resume
exports.saveMyResume = catchAsync(async (req, res, next) => {
  const { education, skills, experience, projects, certificates, achievements, languages, links } = req.body;

  const resume = await Resume.findOneAndUpdate(
    { student: req.user._id },
    {
      education,
      skills,
      experience,
      projects,
      certificates,
      achievements,
      languages,
      links,
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Resume saved successfully.',
    data: resume,
  });
});
