/**
 * Polaris Heartbeat Monitor
 * 
 * Monitors content script liveness by tracking heartbeat pings.
 * If a content script stops sending heartbeats for > TIMEOUT_MS,
 * the background service worker transitions to FOCUSED_IDLE.
 * 
 * Used ONLY by the Background Service Worker.
 */

const HeartbeatMonitor = {
  /** @type {number} - Timeout before declaring content script dead (ms) */
  TIMEOUT_MS: 15000,

  /** @type {Object<number, number>} - tabId → last ping timestamp */
  _pings: {},

  /** @type {Function|null} */
  _onHeartbeatLost: null,

  /** @type {Function|null} */
  _onHeartbeatResumed: null,

  /** @type {boolean} - Whether the content script was alive on last check */
  _wasAlive: false,

  /**
   * Initialize the heartbeat monitor.
   * @param {Object} callbacks
   * @param {Function} callbacks.onLost - called when heartbeat is lost
   * @param {Function} callbacks.onResumed - called when heartbeat resumes
   */
  init({ onLost, onResumed }) {
    this._onHeartbeatLost = onLost;
    this._onHeartbeatResumed = onResumed;
    this._wasAlive = false;
  },

  /**
   * Record a heartbeat ping from a content script.
   * @param {number} tabId
   */
  onPing(tabId) {
    this._pings[tabId] = Date.now();

    // If heartbeat was previously lost, trigger resumed
    if (!this._wasAlive && this._onHeartbeatResumed) {
      this._wasAlive = true;
      this._onHeartbeatResumed(tabId);
    }
    this._wasAlive = true;
  },

  /**
   * Check heartbeat status for the currently tracked tab.
   * Called by chrome.alarms periodically.
   * @param {number|null} activeTabId - the tab we're currently tracking
   */
  check(activeTabId) {
    if (!activeTabId) {
      // No active tab being tracked — nothing to check
      return;
    }

    const lastPing = this._pings[activeTabId];
    const now = Date.now();

    if (!lastPing || (now - lastPing) > this.TIMEOUT_MS) {
      // Content script hasn't pinged recently
      if (this._wasAlive) {
        this._wasAlive = false;
        if (this._onHeartbeatLost) {
          this._onHeartbeatLost(activeTabId);
        }
      }
    }
  },

  /**
   * Remove tracking data for a closed tab.
   * @param {number} tabId
   */
  removeTab(tabId) {
    delete this._pings[tabId];
  },

  /**
   * Clear all heartbeat data.
   */
  clear() {
    this._pings = {};
    this._wasAlive = false;
  },
};
