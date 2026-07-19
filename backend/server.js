require('dotenv').config();
require('./config/dnsPatch');

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
// Trigger hot reload with corrected username
const { initSocket } = require('./sockets/index');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Make io accessible in controllers via req.app.get('io') (used from Phase 4 onward)
app.set('io', io);
initSocket(io);

const start = async () => {
  await connectDB();

  // Seed default academic folders
  try {
    const DriveFolder = require('./models/DriveFolder');
    const defaultFolders = [
      {
        department: 'CSE',
        semester: 1,
        subject: 'All Subjects (Sem 1)',
        category: 'All',
        driveFolderUrl: 'https://drive.google.com/drive/folders/1usKtW9XZmMyFgx03vkhQl6TJrXJtI1Cz',
        driveFolderId: '1usKtW9XZmMyFgx03vkhQl6TJrXJtI1Cz',
        faculty: 'SRM Admin',
        credits: 4
      },
      {
        department: 'CSE',
        semester: 4,
        subject: 'All Subjects (Sem 4)',
        category: 'All',
        driveFolderUrl: 'https://drive.google.com/drive/folders/1sL7tOgcblv2Sf206l2RRM3NODhvB0cBY',
        driveFolderId: '1sL7tOgcblv2Sf206l2RRM3NODhvB0cBY',
        faculty: 'SRM Admin',
        credits: 4
      }
    ];

    for (const df of defaultFolders) {
      const exists = await DriveFolder.findOne({ driveFolderId: df.driveFolderId });
      if (!exists) {
        await DriveFolder.create(df);
        console.log(`[Database Seed] Default folder registered for Semester ${df.semester}.`);
      }
    }
  } catch (seedErr) {
    console.error('[Database Seed Error]', seedErr.message);
  }

  server.listen(PORT, () => {
    console.log(`[Server] CampusConnect API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.error('[UnhandledRejection]', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully.');
  server.close(() => process.exit(0));
});

module.exports = server;
