import api from './api';

export async function aiChat(message, history) {
  const { data } = await api.post('/ai/chat', { message, history });
  return data.data.reply;
}

export async function aiSummarize(payload) {
  const { data } = await api.post('/ai/summarize', payload);
  return data.data;
}

export async function aiGenerateQuiz(payload) {
  const { data } = await api.post('/ai/quiz', payload);
  return data.data;
}

export async function aiGenerateViva(payload) {
  const { data } = await api.post('/ai/viva', payload);
  return data.data;
}

export async function aiAnalyzePyqs(payload) {
  const { data } = await api.post('/ai/pyq-analysis', payload);
  return data.data;
}

export async function aiInterviewPrep(payload) {
  const { data } = await api.post('/ai/interview-prep', payload);
  return data.data;
}

export async function aiImportantQuestions(payload) {
  const { data } = await api.post('/ai/important-questions', payload);
  return data.data;
}
