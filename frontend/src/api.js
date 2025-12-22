const envBase = import.meta.env.VITE_API_BASE?.trim()
const API_BASE = envBase || 'http://localhost:8080'

let authToken = localStorage.getItem('authToken') || ''

export function setAuthToken(token) {
  authToken = token || ''
  if (token) {
    localStorage.setItem('authToken', token)
  } else {
    localStorage.removeItem('authToken')
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function fetchAccounts() {
  return request('/accounts');
}

export async function createAccount(payload) {
  return request('/accounts', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAccount(id, payload) {
  return request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteAccount(id) {
  return request(`/accounts/${id}`, { method: 'DELETE' });
}

export async function openAccount(id) {
  return request(`/accounts/${id}/open`, { method: 'POST' });
}

export async function register(payload) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function login(payload) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

// Tab endpoints tidak dipakai lagi di UI, tetapi bisa ditambahkan kembali jika diperlukan.
