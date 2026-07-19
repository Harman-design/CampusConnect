import api from './api';

export async function fetchStudentFees() {
  const { data } = await api.get('/fees/student');
  return data;
}

export async function createCheckoutOrder(feeType) {
  const { data } = await api.post('/fees/checkout', { feeType });
  return data;
}

export async function verifyPayment(payload) {
  const { data } = await api.post('/fees/verify', payload);
  return data;
}

export async function lookupParentFees(registerNumber, email) {
  const { data } = await api.get('/fees/parent-lookup', {
    params: { registerNumber, email }
  });
  return data;
}

export async function createParentCheckoutOrder(studentId, feeType) {
  const { data } = await api.post('/fees/parent-checkout', { studentId, feeType });
  return data;
}

export async function fetchAdminFeeStructures() {
  const { data } = await api.get('/fees/admin/structures');
  return data;
}

export async function createAdminFeeStructure(payload) {
  const { data } = await api.post('/fees/admin/structures', payload);
  return data;
}

export async function updateAdminFeeStructure(id, payload) {
  const { data } = await api.put(`/fees/admin/structures/${id}`, payload);
  return data;
}

export async function assignFeeToStudent(payload) {
  const { data } = await api.post('/fees/admin/assign', payload);
  return data;
}

export async function waiveLateFine(payload) {
  const { data } = await api.post('/fees/admin/waive-fine', payload);
  return data;
}

export async function fetchAdminAnalytics() {
  const { data } = await api.get('/fees/admin/analytics');
  return data;
}
