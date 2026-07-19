import api from './api';

export async function fetchAcademicResources(params) {
  const { data } = await api.get('/academic', { params });
  return data; // returns { success, data (list), pagination }
}

export async function downloadAcademicResource(id) {
  const { data } = await api.post(`/academic/${id}/download`);
  return data; // returns { success, downloads, url }
}

export async function registerView(id) {
  const { data } = await api.post(`/academic/${id}/view`);
  return data;
}

export async function fetchRecentViews() {
  const { data } = await api.get('/academic/recent-views');
  return data;
}

export async function fetchRecentDownloads() {
  const { data } = await api.get('/academic/recent-downloads');
  return data;
}

export async function fetchSimilarResources(id) {
  const { data } = await api.get(`/academic/${id}/similar`);
  return data;
}

export async function toggleAcademicBookmark(id) {
  const { data } = await api.post(`/academic/${id}/bookmark`);
  return data; // returns { success, isBookmarked }
}

export async function triggerAIContent(id, operation) {
  const { data } = await api.post(`/academic/${id}/ai`, { operation });
  return data.text; // returns AI generated Markdown text
}

// Admin integrations
export async function importFolder(folderUrl) {
  const { data } = await api.post('/academic/admin/import', { folderUrl });
  return data;
}

export async function syncFolder(folderUrl) {
  const { data } = await api.post('/academic/admin/sync', { folderUrl });
  return data;
}

export async function bulkAction(payload) {
  const { data } = await api.post('/academic/admin/bulk', payload);
  return data;
}

export async function fetchAnalytics() {
  const { data } = await api.get('/academic/admin/analytics');
  return data.data; // returns analytics overview metrics
}

export async function updateResource(id, payload) {
  const { data } = await api.patch(`/academic/admin/${id}`, payload);
  return data.data;
}

export async function deleteResource(id) {
  const { data } = await api.delete(`/academic/admin/${id}`);
  return data;
}

// Drive Folders mapping config API endpoints
export async function fetchDriveFolders() {
  const { data } = await api.get('/academic/admin/folders');
  return data;
}

export async function createDriveFolder(payload) {
  const { data } = await api.post('/academic/admin/folders', payload);
  return data;
}

export async function updateDriveFolder(id, payload) {
  const { data } = await api.put(`/academic/admin/folders/${id}`, payload);
  return data;
}

export async function deleteDriveFolder(id) {
  const { data } = await api.delete(`/academic/admin/folders/${id}`);
  return data;
}

export async function syncSingleFolder(id) {
  const { data } = await api.post(`/academic/admin/folders/${id}/sync`);
  return data;
}

export async function syncAllFolders() {
  const { data } = await api.post('/academic/admin/folders/sync-all');
  return data;
}

// Provider configurations management
export async function fetchProviders() {
  const { data } = await api.get('/academic/admin/providers');
  return data; // returns { success, data }
}

export async function updateProviders(config) {
  const { data } = await api.put('/academic/admin/providers', { config });
  return data; // returns { success, message, data }
}

export async function refreshProvider(providerId) {
  const { data } = await api.post(`/academic/admin/providers/${providerId}/refresh`);
  return data; // returns { success, message, data }
}

// Subjects portal endpoints
export async function fetchSubjects(params) {
  const { data } = await api.get('/academic/subjects', { params });
  return data;
}

export async function fetchSubjectDetails(subjectName, params) {
  const { data } = await api.get(`/academic/subjects/${subjectName}`, { params });
  return data;
}
