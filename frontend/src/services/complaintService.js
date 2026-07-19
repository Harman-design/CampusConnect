import api from './api';

export async function fetchComplaints(params) {
  const { data } = await api.get('/complaints', { params });
  return data.data; // { complaints, pagination }
}

export async function fetchComplaintById(id) {
  const { data } = await api.get(`/complaints/${id}`);
  return data.data.complaint;
}

export async function createComplaint(payload) {
  const { data } = await api.post('/complaints', payload);
  return data.data.complaint;
}

export async function resolveComplaint(id, payload) {
  const { data } = await api.patch(`/complaints/${id}/resolve`, payload);
  return data.data.complaint;
}
