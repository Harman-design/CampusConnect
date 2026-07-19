import api from './api';

export async function fetchEvents(params) {
  const { data } = await api.get('/events', { params });
  return data.data; // { events, pagination }
}

export async function fetchEventById(id) {
  const { data } = await api.get(`/events/${id}`);
  return data.data.event;
}

export async function createEvent(payload) {
  const { data } = await api.post('/events', payload);
  return data.data.event;
}

export async function updateEvent(id, payload) {
  const { data } = await api.patch(`/events/${id}`, payload);
  return data.data.event;
}

export async function deleteEvent(id) {
  await api.delete(`/events/${id}`);
}

export async function registerForEvent(id) {
  const { data } = await api.post(`/events/${id}/register`);
  return data.data.registration;
}

export async function cancelEventRegistration(id) {
  await api.delete(`/events/${id}/register`);
}

export async function fetchMyRegistrations() {
  const { data } = await api.get('/events/my-registrations');
  return data.data.registrations;
}

export async function fetchEventRegistrations(eventId) {
  const { data } = await api.get(`/events/${eventId}/registrations`);
  return data.data.registrations;
}
