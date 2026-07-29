/**
 * Polaris Storage Manager
 * 
 * Manages the centralized polaris_state object in chrome.storage.local.
 * All extension state lives under a single key for atomic reads/writes.
 */

/**
 * Default state shape — used on first initialization and as a reference schema.
 */
const DEFAULT_STATE = {
  // Authentication
  auth: {
    token: null,
    refreshToken: null,
    user: null,
    deviceId: null,
    studentId: null,
    authTimestamp: null,
  },

  // Focus Session
  focus: {
    active: false,
    sessionId: null,
    dayId: null,
    startTime: null,
  },

  // Current Context (set ONLY by background)
  context: {
    tabId: null,
    url: null,
    hostname: null,
    website: null,          // "YouTube" | "GeeksforGeeks" | "MDN" | etc.
    category: null,         // "YOUTUBE" | "DOCUMENTATION" | "PRACTICE" | etc.
    isProductive: false,
    learningState: 'NOT_AUTHENTICATED', // NOT_AUTHENTICATED | IDLE | FOCUSED_TRACKING | FOCUSED_PAUSED | FOCUSED_IDLE
  },

  // Video State (YouTube)
  video: {
    videoId: null,
    title: null,
    channel: null,
    duration: 0,
    currentPosition: 0,
    watchPercentage: 0,
    playbackState: null,    // "playing" | "paused" | "ended"
    watchUrl: null,         // https://youtube.com/watch?v=VIDEO_ID
    resumeUrl: null,        // https://youtube.com/watch?v=VIDEO_ID&t=143
  },

  // Article State (Documentation pages)
  article: {
    url: null,
    title: null,
    scrollDepth: 0,
    readingTimeSeconds: 0,
    activeTimeSeconds: 0,
    idleTimeSeconds: 0,
  },

  // Planner Context (from backend)
  planner: {
    planId: null,
    planTopic: null,
    dayNumber: null,
    dayTitle: null,
    estimatedMinutes: null,
  },

  // Metrics
  metrics: {
    todayStudyTimeSeconds: 0,
    focusScore: 85,
  },

  // Heartbeat tracking
  heartbeat: {
    lastPing: null,
    contentScriptAlive: false,
  },
};

const StorageManager = {
  /**
   * Read the full polaris_state from chrome.storage.local.
   * Returns a deep-merged default if state doesn't exist yet.
   * @returns {Promise<Object>}
   */
  async getState() {
    return new Promise((resolve) => {
      chrome.storage.local.get('polaris_state', (res) => {
        const stored = res.polaris_state || {};
        // Deep merge with defaults to ensure all keys exist
        const merged = deepMerge(DEFAULT_STATE, stored);
        resolve(merged);
      });
    });
  },

  /**
   * Update polaris_state by merging a partial update into the existing state.
   * This is an atomic read-modify-write operation.
   * @param {Object} partialUpdate - Partial state object to merge
   * @returns {Promise<Object>} The full updated state
   */
  async updateState(partialUpdate) {
    const current = await this.getState();
    const updated = deepMerge(current, partialUpdate);
    return new Promise((resolve) => {
      chrome.storage.local.set({ polaris_state: updated }, () => {
        resolve(updated);
      });
    });
  },

  /**
   * Replace the entire polaris_state with a new state object.
   * Used only during initialization or full state reset.
   * @param {Object} state
   * @returns {Promise<void>}
   */
  async setState(state) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ polaris_state: state }, () => resolve());
    });
  },

  /**
   * Clear a specific sub-section of the state by resetting it to defaults.
   * @param {string} section - e.g. 'video', 'article', 'context'
   * @returns {Promise<Object>}
   */
  async clearSection(section) {
    if (DEFAULT_STATE[section]) {
      return this.updateState({ [section]: { ...DEFAULT_STATE[section] } });
    }
    return this.getState();
  },

  // ── Convenience Accessors ──

  /**
   * Get or create a persistent device ID.
   * Stored outside polaris_state for backward compatibility.
   * @returns {Promise<string>}
   */
  async getDeviceId() {
    const state = await this.getState();
    if (state.auth.deviceId) return state.auth.deviceId;

    // Check legacy key
    const legacy = await this.getRaw('polaris_device_id');
    if (legacy) {
      await this.updateState({ auth: { deviceId: legacy } });
      return legacy;
    }

    // Generate new device ID
    const newId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    await this.updateState({ auth: { deviceId: newId } });
    // Also store in legacy key for backward compat during migration
    await this.setRaw({ polaris_device_id: newId });
    return newId;
  },

  async getToken() {
    const state = await this.getState();
    return state.auth.token || null;
  },

  async setAuth(token, user, authMeta = {}) {
    const current = await this.getState();
    return this.updateState({
      auth: {
        token: token || current.auth.token,
        refreshToken: authMeta.refreshToken || current.auth.refreshToken || null,
        user: user || current.auth.user,
        deviceId: authMeta.deviceId || current.auth.deviceId || null,
        studentId: authMeta.studentId || (user && user.id) || current.auth.studentId || null,
        authTimestamp: authMeta.authTimestamp || current.auth.authTimestamp || new Date().toISOString(),
      },
      context: { learningState: 'IDLE' },
    });
  },

  async clearAuth() {
    return this.updateState({
      auth: { token: null, user: null },
      context: { learningState: 'NOT_AUTHENTICATED' },
      focus: { active: false, sessionId: null, dayId: null, startTime: null },
    });
  },

  async setFocusSession(session) {
    if (session) {
      return this.updateState({
        focus: {
          active: true,
          sessionId: session.id,
          dayId: session.dayId || null,
          startTime: session.startTime || new Date().toISOString(),
        },
      });
    } else {
      return this.updateState({
        focus: { active: false, sessionId: null, dayId: null, startTime: null },
        video: { ...DEFAULT_STATE.video },
        article: { ...DEFAULT_STATE.article },
      });
    }
  },

  async isFocusActive() {
    const state = await this.getState();
    return !!state.focus.active;
  },

  // ── Raw chrome.storage access (for migration / non-state data) ──

  getRaw(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (res) => resolve(res[key] || null));
    });
  },

  setRaw(items) {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, () => resolve());
    });
  },

  removeRaw(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, () => resolve());
    });
  },
};

/**
 * Deep merge two objects. Source values overwrite target values.
 * Arrays are replaced, not concatenated.
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
