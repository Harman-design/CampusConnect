import api from './api';

export async function fetchPlacements(params) {
  const { data } = await api.get('/placements', { params });
  return data.data; // { placements, pagination }
}

export async function fetchPlacementById(id) {
  const { data } = await api.get(`/placements/${id}`);
  return data.data.placement;
}

export async function createPlacement(payload) {
  const { data } = await api.post('/placements', payload);
  return data.data.placement;
}

export async function updatePlacement(id, payload) {
  const { data } = await api.patch(`/placements/${id}`, payload);
  return data.data.placement;
}

export async function deletePlacement(id) {
  await api.delete(`/placements/${id}`);
}

export async function applyToPlacement(id) {
  const { data } = await api.post(`/placements/${id}/apply`);
  return data.data.application;
}

export async function fetchMyApplications() {
  const { data } = await api.get('/placements/my-applications');
  return data.data.applications;
}

export async function withdrawApplication(applicationId) {
  await api.delete(`/placements/applications/${applicationId}`);
}

export async function fetchApplicants(placementId) {
  const { data } = await api.get(`/placements/${placementId}/applicants`);
  return data.data.applications;
}

export async function updateApplicationStatus(applicationId, payload) {
  const { data } = await api.patch(`/placements/applications/${applicationId}/status`, payload);
  return data.data.application;
}
