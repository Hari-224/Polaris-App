import api from './api';

const focusService = {
  async startFocus(dayId) {
    const response = await api.post('/focus/start', { dayId });
    // Notify Extension if present
    if (typeof window.chrome !== 'undefined' && window.chrome.runtime && window.chrome.runtime.sendMessage) {
      try {
        const token = localStorage.getItem('polaris_token');
        const user = JSON.parse(localStorage.getItem('polaris_user') || '{}');
        window.chrome.runtime.sendMessage({
          type: 'POLARIS_SYNC_AUTH',
          token,
          user
        });
      } catch (e) {
        // Ignore extension messaging errors if extension is not installed
      }
    }
    return response.data;
  },

  async endFocus(sessionId) {
    const response = await api.post('/focus/end', { sessionId });
    return response.data;
  },

  async getActiveFocus() {
    const response = await api.get('/focus/active');
    return response.data;
  }
};

export default focusService;
