const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Resolves a "target" into a concrete list of recipient user ids.
 * target can be: 'all' | 'students' | 'admins' | an array of user ids
 */
async function resolveRecipientIds(target) {
  if (Array.isArray(target)) {
    return target;
  }
  const roleFilter = target === 'students' ? { role: 'student' } : target === 'admins' ? { role: 'admin' } : {};
  const users = await User.find({ ...roleFilter, isActive: true }).select('_id');
  return users.map((u) => u._id);
}

/**
 * Creates a notification for every resolved recipient and pushes it to them
 * in real time over their personal Socket.IO room ("user:<id>").
 *
 * @param {object} params
 * @param {import('socket.io').Server} params.io
 * @param {'all'|'students'|'admins'|string[]} params.target
 * @param {'notes'|'pyq'|'placement'|'event'|'announcement'} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.link]
 * @param {string} params.createdBy - admin user id
 */
async function notifyUsers({ io, target, type, title, message, link = '', createdBy }) {
  const recipientIds = await resolveRecipientIds(target);
  if (recipientIds.length === 0) return { count: 0 };

  const docs = recipientIds.map((recipient) => ({
    recipient,
    type,
    title,
    message,
    link,
    createdBy,
  }));

  const created = await Notification.insertMany(docs);

  if (io) {
    created.forEach((notification) => {
      io.to(`user:${notification.recipient.toString()}`).emit('notification:new', notification);
    });
  }

  return { count: created.length };
}

module.exports = { notifyUsers, resolveRecipientIds };
