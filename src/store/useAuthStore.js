import { create } from 'zustand';
import api, { getErrorMessage } from '../lib/api';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('bdlegal_user') || 'null');
  } catch {
    return null;
  }
};

const persist = (token, user) => {
  if (token) localStorage.setItem('bdlegal_token', token);
  if (user) localStorage.setItem('bdlegal_user', JSON.stringify(user));
};

const clearPersisted = () => {
  localStorage.removeItem('bdlegal_token');
  localStorage.removeItem('bdlegal_user');
};

// Backend may return { token } or { access_token }
const extractToken = (data) => data?.token || data?.access_token || null;

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('bdlegal_token') || null,
  user: readUser(),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = extractToken(data);
      persist(token, data.user);
      set({ token, user: data.user, loading: false });
      return data.user;
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Invalid email or password.'
        : getErrorMessage(err, 'Login failed');
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', payload);
      const token = extractToken(data);
      persist(token, data.user);
      set({ token, user: data.user, loading: false });
      return data.user;
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed');
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: () => {
    clearPersisted();
    set({ token: null, user: null, error: null });
  },

  fetchMe: async () => {
    if (!get().token) return null;
    set({ loading: true });
    try {
      const { data } = await api.get('/auth/me');
      persist(null, data);
      set({ user: data, loading: false });
      return data;
    } catch {
      // Token invalid / backend unreachable — clear silently
      clearPersisted();
      set({ token: null, user: null, loading: false });
      return null;
    }
  },

  setUser: (user) => {
    persist(null, user);
    set({ user });
  },

  updateUser: (updatedFields) => {
    const current = get().user || {};
    const newUser = { ...current, ...updatedFields };
    persist(null, newUser);
    set({ user: newUser });
    return newUser;
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
