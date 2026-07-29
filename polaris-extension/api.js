/**
 * Polaris API Client
 * 
 * Used ONLY by the Background Service Worker.
 * Popup and content scripts NEVER call API directly.
 * 
 * Features:
 * - Retry with exponential backoff
 * - 401 detection triggers auth reset
 * - Batch endpoints for tracking data
 */

let API_BASE_URL = 'http://localhost:8081/api';

const RETRY_DELAYS = [1000, 2000, 5000];

/**
 * Make an authenticated API request with retry logic.
 * @param {string} endpoint
 * @param {Object} options - fetch options
 * @param {string} token - JWT token
 * @param {number} [retryCount=0]
 * @returns {Promise<Object>}
 */
async function fetchWithAuth(endpoint, options = {}, token = null, retryCount = 0) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.warn('[Polaris API] Token expired or unauthorized (401)');
      return { success: false, error: 'Unauthorized', authExpired: true };
    }

    if (!response.ok && retryCount < RETRY_DELAYS.length) {
      console.warn(`[Polaris API] HTTP ${response.status} on ${endpoint}, retrying (${retryCount + 1}/${RETRY_DELAYS.length})...`);
      await sleep(RETRY_DELAYS[retryCount]);
      return fetchWithAuth(endpoint, options, token, retryCount + 1);
    }

    try {
      const data = await response.json();
      return data;
    } catch (e) {
      return { success: false, error: 'Invalid JSON response' };
    }
  } catch (err) {
    // Switch host on network error in MV3 service worker
    if (API_BASE_URL.includes('localhost')) {
      API_BASE_URL = 'http://127.0.0.1:8081/api';
    } else if (API_BASE_URL.includes('127.0.0.1')) {
      API_BASE_URL = 'http://localhost:8081/api';
    }

    if (retryCount < RETRY_DELAYS.length) {
      console.warn(`[Polaris API] Network error on ${endpoint}, retrying (${retryCount + 1}/${RETRY_DELAYS.length})...`);
      await sleep(RETRY_DELAYS[retryCount]);
      return fetchWithAuth(endpoint, options, token, retryCount + 1);
    }
    console.error(`[Polaris API] Failed after ${RETRY_DELAYS.length} retries: ${endpoint}`, err.message);
    return { success: false, error: 'Backend offline or network error' };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ExtensionAPI = {
  /**
   * Start a focus session.
   * @param {number} dayId
   * @param {string} token
   */
  startFocus(dayId, token) {
    return fetchWithAuth('/focus/start', {
      method: 'POST',
      body: JSON.stringify({ dayId }),
    }, token);
  },

  /**
   * End a focus session.
   * @param {number} sessionId
   * @param {string} token
   */
  endFocus(sessionId, token) {
    return fetchWithAuth('/focus/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }, token);
  },

  /**
   * Get the currently active focus session.
   * @param {string} token
   */
  getActiveFocus(token) {
    return fetchWithAuth('/focus/active', { method: 'GET' }, token);
  },

  /**
   * Get the extension context (user info, plan, day, metrics).
   * @param {string} token
   */
  getExtensionContext(token) {
    return fetchWithAuth('/extension/context', { method: 'GET' }, token);
  },

  /**
   * Check device authorization status (unauthenticated call).
   * @param {string} deviceId
   */
  async checkAuthStatus(deviceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/extension/auth-status?deviceId=${encodeURIComponent(deviceId)}`);
      return await response.json();
    } catch (err) {
      return { success: false, error: 'Backend offline' };
    }
  },

  /**
   * Send a single tracking activity record.
   * @param {Object} payload
   * @param {string} token
   */
  sendTrackingActivity(payload, token) {
    return fetchWithAuth('/tracking/activity', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Send a single tracking resource record.
   * @param {Object} payload
   * @param {string} token
   */
  sendTrackingResource(payload, token) {
    return fetchWithAuth('/tracking/resource', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },

  /**
   * Send a batch of tracking activity records.
   * @param {Array<Object>} payloads
   * @param {string} token
   */
  sendTrackingActivityBatch(payloads, token) {
    return fetchWithAuth('/tracking/activity/batch', {
      method: 'POST',
      body: JSON.stringify(payloads),
    }, token);
  },

  /**
   * Send a batch of tracking resource records.
   * @param {Array<Object>} payloads
   * @param {string} token
   */
  sendTrackingResourceBatch(payloads, token) {
    return fetchWithAuth('/tracking/resource/batch', {
      method: 'POST',
      body: JSON.stringify(payloads),
    }, token);
  },

  /**
   * Send a tracking session update (focus score, duration).
   * @param {Object} payload
   * @param {string} token
   */
  sendTrackingSession(payload, token) {
    return fetchWithAuth('/tracking/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token);
  },
};
