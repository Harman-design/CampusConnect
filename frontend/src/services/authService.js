import api, { setAccessToken } from './api';

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload);
  setAccessToken(data.data.accessToken);
  localStorage.setItem('token', data.data.accessToken);
  return data.data.user;
}

export async function loginUser(payload) {
  const { data } = await api.post('/auth/login', payload);
  setAccessToken(data.data.accessToken);
  localStorage.setItem('token', data.data.accessToken);
  return data.data.user;
}

export async function logoutUser() {
  await api.post('/auth/logout');
  setAccessToken(null);
  localStorage.removeItem('token');
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data.user;
}

export async function refreshSession() {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.data.accessToken);
  localStorage.setItem('token', data.data.accessToken);
  return data.data.accessToken;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data.message;
}

export async function resetPassword(token, password) {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data.message;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  setAccessToken(data.data.accessToken);
  localStorage.setItem('token', data.data.accessToken);
  return data.message;
}
