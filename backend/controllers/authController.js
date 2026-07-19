const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendEmail, passwordResetEmailTemplate } = require('../utils/sendEmail');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  msFromDuration,
  generateRandomToken,
  hashToken,
} = require('../utils/generateTokens');

const REFRESH_COOKIE_NAME = 'ccRefreshToken';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge: msFromDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    path: '/api/auth',
  };
}

async function issueTokens(user, req, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const decoded = require('jsonwebtoken').decode(refreshToken);
  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt: new Date(decoded.exp * 1000),
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.cookie('ccLoggedIn', 'true', {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge: msFromDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
  });
  return accessToken;
}

// @route POST /api/auth/register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role, department, semester, registerNumber } = req.body;

  if (!email || !email.trim().toLowerCase().endsWith('@srmist.edu.in')) {
    return next(new AppError('Only official SRM Institute email addresses (@srmist.edu.in) are allowed to register.', 400));
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  // Prevent public self-registration as admin unless explicitly allowed by an already-authenticated admin.
  const safeRole = (role === 'admin' && req.user?.role === 'admin') ? 'admin' : (role === 'faculty' ? 'faculty' : 'student');

  const user = await User.create({
    name,
    email,
    password,
    role: safeRole,
    department,
    semester,
    registerNumber,
  });

  const accessToken = await issueTokens(user, req, res);

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

// @route POST /api/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim().toLowerCase().endsWith('@srmist.edu.in')) {
    return next(new AppError('Please login using your official SRM email.', 403));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('This account has been deactivated. Contact admin.', 403));
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = await issueTokens(user, req, res);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

// @route POST /api/auth/refresh
exports.refresh = catchAsync(async (req, res, next) => {
  const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const tokenFromBody = req.body?.refreshToken;
  const token = tokenFromCookie || tokenFromBody;

  if (!token) {
    return next(new AppError('Refresh token missing. Please log in again.', 401));
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
  }

  const storedToken = await RefreshToken.findOne({ token });
  if (!storedToken || storedToken.revoked) {
    return next(new AppError('Refresh token has been revoked. Please log in again.', 401));
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    return next(new AppError('User no longer exists or is deactivated.', 401));
  }

  // Rotate refresh token
  storedToken.revoked = true;
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  const newDecoded = require('jsonwebtoken').decode(newRefreshToken);

  storedToken.replacedByToken = newRefreshToken;
  await storedToken.save();

  await RefreshToken.create({
    user: user._id,
    token: newRefreshToken,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt: new Date(newDecoded.exp * 1000),
  });

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());
  res.cookie('ccLoggedIn', 'true', {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge: msFromDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed.',
    data: { accessToken: newAccessToken },
  });
});

// @route POST /api/auth/logout
exports.logout = catchAsync(async (req, res, next) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  if (token) {
    await RefreshToken.updateOne({ token }, { revoked: true });
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.clearCookie('ccLoggedIn');

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// @route GET /api/auth/me
exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user.toSafeJSON() },
  });
});

// @route POST /api/auth/forgot-password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return a generic success message to avoid leaking which emails are registered.
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const rawToken = generateRandomToken();
  const hashedToken = hashToken(rawToken);
  const expiresMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MIN) || 30;

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'CampusConnect - Password Reset Request',
      html: passwordResetEmailTemplate(user.name, resetUrl),
      text: `Reset your password: ${resetUrl}`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Failed to send reset email. Please try again later.', 500));
  }

  res.status(200).json(genericResponse);
});

// @route POST /api/auth/reset-password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token, password } = req.body;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return next(new AppError('Password reset token is invalid or has expired.', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Revoke all existing refresh tokens for this user as a security measure
  await RefreshToken.updateMany({ user: user._id, revoked: false }, { revoked: true });

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.',
  });
});

// @route POST /api/auth/change-password
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  // Revoke all other sessions
  await RefreshToken.updateMany({ user: user._id, revoked: false }, { revoked: true });

  const accessToken = await issueTokens(user, req, res);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
    data: { accessToken },
  });
});
