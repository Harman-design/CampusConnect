const mongoose = require('mongoose');

// Disable query buffering globally so operations fail-fast when DB connection is down
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    // Flag legacy user accounts with invalid email domains for review
    const User = require('../models/User');
    const result = await User.updateMany(
      { email: { $not: /@srmist\.edu\.in$/i }, flaggedForReview: { $ne: true } },
      { $set: { flaggedForReview: true } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Migration] Flagged ${result.modifiedCount} legacy user accounts with non-SRM domains for review.`);
    }

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting to reconnect is handled by the driver.');
    });
  } catch (error) {
    console.error("===== FULL ERROR =====");
    console.error(error);
    console.warn('[MongoDB] Warning: Initial connection failed. Process continuing...');
  }
};

module.exports = connectDB;
