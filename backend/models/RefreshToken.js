const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    ip: {
      type: String,
      default: '',
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    replacedByToken: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index: MongoDB automatically deletes expired refresh tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema, 'refresh_tokens');
