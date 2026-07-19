import api from './api';

export async function fetchOverview() {
  const { data } = await api.get('/analytics/overview');
  return data.data;
}

export async function fetchDownloadsAnalytics(params) {
  const { data } = await api.get('/analytics/downloads', { params });
  return data.data;
}

export async function fetchEventAnalytics(params) {
  const { data } = await api.get('/analytics/events', { params });
  return data.data;
}

export async function fetchPlacementAnalytics(params) {
  const { data } = await api.get('/analytics/placements', { params });
  return data.data;
}

export async function fetchUserAnalytics(params) {
  const { data } = await api.get('/analytics/users', { params });
  return data.data;
}
