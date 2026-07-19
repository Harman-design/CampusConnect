const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function msFromDuration(durationStr) {
  // Supports formats like "15m", "7d", "1h" used by jsonwebtoken's ms lib convention
  const match = /^(\d+)([smhd])$/.exec(durationStr);
  if (!match) return 15 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * unitMs[unit];
}

function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  msFromDuration,
  generateRandomToken,
  hashToken,
};
