import api from './api';

export async function fetchNotifications(params) {
  const { data } = await api.get('/notifications', { params });
  return data.data; // { notifications, unreadCount, pagination }
}

export async function fetchUnreadCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data.data.unreadCount;
}

export async function markNotificationRead(id) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/mark-all-read');
}

export async function broadcastNotification(payload) {
  const { data } = await api.post('/notifications/broadcast', payload);
  return data.data;
}
