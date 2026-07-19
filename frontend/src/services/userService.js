import api from './api';

export async function updateMyProfile(payload) {
  const { data } = await api.patch('/users/profile', payload);
  return data.data.user;
}
