import api from './api';

const TOKEN_KEY = 'polaris_token';
const USER_KEY = 'polaris_user';

const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.data.success) {
      localStorage.setItem(TOKEN_KEY, response.data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async login(data) {
    const response = await api.post('/auth/login', data);
    if (response.data.success) {
      localStorage.setItem(TOKEN_KEY, response.data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  async authorizeExtension(deviceId) {
    const response = await api.post('/extension/authorize', { deviceId });
    return response.data;
  },
};

export default authService;
