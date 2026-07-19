const AppError = require('../utils/AppError');

/**
 * Usage: restrictTo('admin') or restrictTo('admin', 'student')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = { restrictTo };
