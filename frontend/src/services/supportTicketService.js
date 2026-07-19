import api from './api';

export async function fetchTickets(params) {
  const { data } = await api.get('/support-tickets', { params });
  return data.data; // { tickets, pagination }
}

export async function fetchTicketById(id) {
  const { data } = await api.get(`/support-tickets/${id}`);
  return data.data.ticket;
}

export async function createTicket(payload) {
  const { data } = await api.post('/support-tickets', payload);
  return data.data.ticket;
}

export async function addTicketResponse(id, message) {
  const { data } = await api.post(`/support-tickets/${id}/responses`, { message });
  return data.data.ticket;
}

export async function updateTicketStatus(id, status) {
  const { data } = await api.patch(`/support-tickets/${id}/status`, { status });
  return data.data.ticket;
}
