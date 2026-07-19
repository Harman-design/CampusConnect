const { verifyAccessToken } = require('../utils/generateTokens');

function initSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token missing.'));
      }
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] User connected: ${socket.userId} (${socket.userRole})`);

    // Join a personal room so we can target notifications directly at this user
    socket.join(`user:${socket.userId}`);

    // Admins join a shared room for broadcast-style admin events
    if (socket.userRole === 'admin') {
      socket.join('admins');
    }

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${socket.userId}`);
    });

    // Notification, chat, event, and placement event handlers are added
    // in Phase 4 (Notifications) and Phase 5 (AI Assistant chat).
  });
}

module.exports = { initSocket };
