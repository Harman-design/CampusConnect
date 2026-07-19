import api from './api';

export async function fetchPyqs(params) {
  const { data } = await api.get('/pyqs', { params });
  return data.data; // { pyqs, pagination }
}

export async function fetchPyqById(id) {
  const { data } = await api.get(`/pyqs/${id}`);
  return data.data.pyq;
}

export async function uploadPyq(formData) {
  const { data } = await api.post('/pyqs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.pyq;
}

export async function updatePyq(id, payload) {
  const { data } = await api.patch(`/pyqs/${id}`, payload);
  return data.data.pyq;
}

export async function deletePyq(id) {
  await api.delete(`/pyqs/${id}`);
}

export async function downloadPyq(id) {
  const { data } = await api.post(`/pyqs/${id}/download`);
  return data.data.fileUrl;
}
