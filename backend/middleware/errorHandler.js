const AppError = require('../utils/AppError');

function handleCastErrorDB(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
}

function handleDuplicateFieldsDB(err) {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue ? err.keyValue[field] : '';
  return new AppError(`Duplicate value for field "${field}": "${value}". Please use another value.`, 409);
}

function handleValidationErrorDB(err) {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data: ${messages.join('. ')}`, 400);
}

function handleJWTError() {
  return new AppError('Invalid token. Please log in again.', 401);
}

function handleJWTExpiredError() {
  return new AppError('Your token has expired. Please log in again.', 401);
}

function handleMulterError(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File is too large. Maximum size is 25MB.', 400);
  }
  return new AppError(`File upload error: ${err.message}`, 400);
}

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  let error = err;
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (error.name === 'MulterError') error = handleMulterError(error);

  if (process.env.NODE_ENV === 'development') {
    if (error.isOperational) {
      console.log(`[ClientError] ${error.statusCode} - ${error.message}`);
    } else {
      console.error('[ERROR]', error);
    }
  }

  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.isOperational ? error.message : 'Something went wrong. Please try again later.',
    code: error.code || undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

module.exports = { globalErrorHandler, notFoundHandler };
