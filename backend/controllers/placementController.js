const Placement = require('../models/Placement');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { checkEligibility } = require('../services/eligibilityService');
const { notifyUsers } = require('../services/notificationService');

// @route POST /api/placements — Admin
exports.createPlacement = catchAsync(async (req, res) => {
  const placement = await Placement.create({ ...req.body, createdBy: req.user._id });

  await notifyUsers({
    io: req.app.get('io'),
    target: 'students',
    type: 'placement',
    title: 'New placement drive',
    message: `${placement.companyName} is hiring for ${placement.role}. Apply by ${new Date(placement.applicationDeadline).toLocaleDateString()}.`,
    link: `/placements?highlight=${placement._id}`,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Placement drive created.', data: { placement } });
});

// @route GET /api/placements — Student & Admin (list + filter)
exports.getPlacements = catchAsync(async (req, res) => {
  const { search, status, department } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (req.query.type) filter.type = req.query.type;
  if (search) filter.$text = { $search: search };
  if (department) filter['eligibility.allowedDepartments'] = department;

  const [placements, total] = await Promise.all([
    Placement.find(filter).sort({ applicationDeadline: 1 }).skip(skip).limit(limit),
    Placement.countDocuments(filter),
  ]);

  let placementsWithMeta = placements;

  // For students, annotate each placement with eligibility + whether they've already applied
  if (req.user.role === 'student') {
    const placementIds = placements.map((p) => p._id);
    const myApplications = await Application.find({ placement: { $in: placementIds }, student: req.user._id });
    const applicationByPlacement = new Map(myApplications.map((a) => [a.placement.toString(), a]));

    placementsWithMeta = placements.map((p) => {
      const eligibility = checkEligibility(req.user, p);
      const myApplication = applicationByPlacement.get(p._id.toString());
      return {
        ...p.toObject(),
        eligibilityCheck: eligibility,
        myApplicationStatus: myApplication ? myApplication.status : null,
      };
    });
  }

  res.status(200).json({
    success: true,
    data: { placements: placementsWithMeta, pagination: buildPaginationMeta(total, page, limit) },
  });
});

// @route GET /api/placements/:id
exports.getPlacementById = catchAsync(async (req, res, next) => {
  const placement = await Placement.findById(req.params.id);
  if (!placement) return next(new AppError('Placement not found.', 404));

  let result = placement.toObject();

  if (req.user.role === 'student') {
    result.eligibilityCheck = checkEligibility(req.user, placement);
    const myApplication = await Application.findOne({ placement: placement._id, student: req.user._id });
    result.myApplicationStatus = myApplication ? myApplication.status : null;
  }

  res.status(200).json({ success: true, data: { placement: result } });
});

// @route PATCH /api/placements/:id — Admin
exports.updatePlacement = catchAsync(async (req, res, next) => {
  const placement = await Placement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!placement) return next(new AppError('Placement not found.', 404));
  res.status(200).json({ success: true, message: 'Placement updated.', data: { placement } });
});

// @route DELETE /api/placements/:id — Admin
exports.deletePlacement = catchAsync(async (req, res, next) => {
  const placement = await Placement.findByIdAndDelete(req.params.id);
  if (!placement) return next(new AppError('Placement not found.', 404));
  await Application.deleteMany({ placement: placement._id });
  res.status(200).json({ success: true, message: 'Placement deleted.' });
});

// @route POST /api/placements/:id/apply — Student
exports.applyToPlacement = catchAsync(async (req, res, next) => {
  const placement = await Placement.findById(req.params.id);
  if (!placement) return next(new AppError('Placement not found.', 404));

  if (placement.status === 'closed') {
    return next(new AppError('This placement drive is closed.', 400));
  }
  if (new Date(placement.applicationDeadline) < new Date()) {
    return next(new AppError('The application deadline for this drive has passed.', 400));
  }

  const { isEligible, reasons } = checkEligibility(req.user, placement);
  if (!isEligible) {
    return next(new AppError(`You are not eligible for this drive: ${reasons.join(' ')}`, 403));
  }

  const existing = await Application.findOne({ placement: placement._id, student: req.user._id });
  if (existing) {
    return next(new AppError('You have already applied to this placement drive.', 409));
  }

  const application = await Application.create({
    placement: placement._id,
    student: req.user._id,
    resumeUrlSnapshot: req.user.resumeUrl || '',
  });

  res.status(201).json({ success: true, message: 'Application submitted successfully.', data: { application } });
});

// @route GET /api/placements/my-applications — Student
exports.getMyApplications = catchAsync(async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .populate('placement', 'companyName role packageLPA applicationDeadline status')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { applications } });
});

// @route DELETE /api/placements/applications/:id — Student (withdraw application)
exports.withdrawApplication = catchAsync(async (req, res, next) => {
  const application = await Application.findOne({ _id: req.params.id, student: req.user._id });
  if (!application) return next(new AppError('Application not found.', 404));
  if (application.status !== 'applied') {
    return next(new AppError('You can only withdraw an application that is still in "applied" status.', 400));
  }
  await application.deleteOne();
  res.status(200).json({ success: true, message: 'Application withdrawn.' });
});

// @route GET /api/placements/:id/applicants — Admin (view applicants for a drive)
exports.getApplicants = catchAsync(async (req, res, next) => {
  const placement = await Placement.findById(req.params.id);
  if (!placement) return next(new AppError('Placement not found.', 404));

  const applications = await Application.find({ placement: placement._id })
    .populate('student', 'name email department semester cgpa backlogs registerNumber resumeUrl')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { applications } });
});

// @route PATCH /api/placements/applications/:id/status — Admin
exports.updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { status, notes } = req.body;
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { status, ...(notes !== undefined && { notes }) },
    { new: true, runValidators: true }
  )
    .populate('student', 'name email')
    .populate('placement', 'companyName role');

  if (!application) return next(new AppError('Application not found.', 404));

  await notifyUsers({
    io: req.app.get('io'),
    target: [application.student._id],
    type: 'placement',
    title: 'Application status updated',
    message: `Your application to ${application.placement.companyName} (${application.placement.role}) is now "${status}".`,
    link: `/placements`,
    createdBy: req.user._id,
  });

  res.status(200).json({ success: true, message: 'Application status updated.', data: { application } });
});
