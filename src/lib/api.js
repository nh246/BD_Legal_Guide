import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bdlegal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints handle their own 401s (wrong password etc.) — never redirect for them.
const AUTH_FORM_ENDPOINTS = ['/auth/login', '/auth/register'];

// On 401, clear auth state and redirect to /login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = AUTH_FORM_ENDPOINTS.some((p) => url.endsWith(p));
    if (error.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem('bdlegal_token');
      localStorage.removeItem('bdlegal_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Turn any axios error into a short, human-readable message.
 */
export function getErrorMessage(error, fallback = 'Something went wrong') {
  if (!error) return fallback;
  if (!error.response) return 'Could not reach server. Please check your connection and try again.';
  const { status, data } = error.response;
  const detail = data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || String(d)).join(', ');
  }
  if (typeof detail === 'string' && detail !== 'Not Found') return detail;
  if (status === 404) return 'This service is not available yet.';
  if (status >= 500) return 'Server error. Please try again later.';
  return fallback;
}

/**
 * Normalize list responses: accepts a raw array or { items | results | data: [...] }.
 */
export function asList(data, key) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (key && Array.isArray(data[key])) return data[key];
  return data.items || data.results || data.data || [];
}

export default api;
