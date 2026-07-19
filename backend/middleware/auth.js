const { verifyAccessToken } = require('../utils/generateTokens');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Access token expired.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid access token.', 401));
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('This account has been deactivated.', 403));
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password was changed recently. Please log in again.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
