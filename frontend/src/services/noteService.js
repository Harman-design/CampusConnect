import api from './api';

export async function fetchNotes(params) {
  const { data } = await api.get('/notes', { params });
  return data.data; // { notes, pagination }
}

export async function fetchNoteById(id) {
  const { data } = await api.get(`/notes/${id}`);
  return data.data.note;
}

export async function uploadNoteFile(formData) {
  const { data } = await api.post('/notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.note;
}

export async function uploadNoteDriveLink(payload) {
  const { data } = await api.post('/notes/drive-link', payload);
  return data.data.note;
}

export async function updateNote(id, payload) {
  const { data } = await api.patch(`/notes/${id}`, payload);
  return data.data.note;
}

export async function deleteNote(id) {
  await api.delete(`/notes/${id}`);
}

export async function downloadNote(id) {
  const { data } = await api.post(`/notes/${id}/download`);
  return data.data.fileUrl;
}

export async function toggleNoteBookmark(id) {
  const { data } = await api.post(`/notes/${id}/bookmark`);
  return data.data.isBookmarked;
}
