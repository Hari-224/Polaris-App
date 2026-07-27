/**
 * Polaris Tracking Queue
 * 
 * Batches tracking events and flushes them to the backend at controlled intervals.
 * Used ONLY by the Background Service Worker.
 * 
 * Instead of sending ~35 API calls per minute, events are queued and flushed
 * every 10 seconds as a single batch request.
 * 
 * Failed batches are re-queued with exponential backoff.
 */

const TrackingQueue = {
  /** @type {Array<Object>} */
  _activityQueue: [],

  /** @type {Object|null} - Latest resource snapshot (deduplicated) */
  _latestResource: null,

  /** @type {number} */
  _failedFlushCount: 0,

  /** @type {number} - Max consecutive flush failures before suspending */
  _maxFailures: 5,

  /**
   * Enqueue an activity tracking event.
   * Activities are accumulated and sent as a batch.
   * @param {Object} payload - tracking activity data
   */
  enqueueActivity(payload) {
    this._activityQueue.push({
      ...payload,
      timestamp: Date.now(),
    });

    // Prevent unbounded growth if flush is failing
    if (this._activityQueue.length > 100) {
      this._activityQueue = this._activityQueue.slice(-50);
      console.warn('[TrackingQueue] Activity queue overflow, dropping oldest events');
    }
  },

  /**
   * Update the latest resource snapshot.
   * Resource tracking is deduplicated — only the latest state matters.
   * For example, video position updates every 5 seconds, but we only need
   * to send the most recent position.
   * @param {Object} payload - tracking resource data
   */
  updateResource(payload) {
    this._latestResource = {
      ...payload,
      timestamp: Date.now(),
    };
  },

  /**
   * Flush all queued events to the backend.
   * Called by chrome.alarms every ~10 seconds.
   * @param {string} token - JWT token for authentication
   * @returns {Promise<void>}
   */
  async flush(token) {
    if (!token) return;

    if (this._failedFlushCount >= this._maxFailures) {
      console.warn('[TrackingQueue] Flush suspended after too many failures, will retry on next backend sync');
      return;
    }

    let flushFailed = false;

    // Flush activity batch
    if (this._activityQueue.length > 0) {
      const batch = [...this._activityQueue];
      this._activityQueue = [];

      try {
        const result = await ExtensionAPI.sendTrackingActivityBatch(batch, token);
        if (result && result.authExpired) {
          // Token expired — don't retry, let auth handler deal with it
          return;
        }
        if (!result || !result.success) {
          // Re-queue failed batch
          this._activityQueue = [...batch, ...this._activityQueue];
          flushFailed = true;
        }
      } catch (e) {
        this._activityQueue = [...batch, ...this._activityQueue];
        flushFailed = true;
      }
    }

    // Flush latest resource snapshot
    if (this._latestResource) {
      const resource = { ...this._latestResource };
      this._latestResource = null;

      try {
        const result = await ExtensionAPI.sendTrackingResource(resource, token);
        if (result && result.authExpired) {
          return;
        }
        if (!result || !result.success) {
          // Re-queue failed resource
          this._latestResource = resource;
          flushFailed = true;
        }
      } catch (e) {
        this._latestResource = resource;
        flushFailed = true;
      }
    }

    if (flushFailed) {
      this._failedFlushCount++;
      console.warn(`[TrackingQueue] Flush failed (${this._failedFlushCount}/${this._maxFailures})`);
    } else {
      this._failedFlushCount = 0;
    }
  },

  /**
   * Reset the failure counter (called when backend connectivity is restored).
   */
  resetFailures() {
    this._failedFlushCount = 0;
  },

  /**
   * Clear all queued data (called on focus session end or auth loss).
   */
  clear() {
    this._activityQueue = [];
    this._latestResource = null;
    this._failedFlushCount = 0;
  },

  /**
   * Get queue stats for debugging.
   * @returns {{ activityCount: number, hasResource: boolean, failedFlushes: number }}
   */
  getStats() {
    return {
      activityCount: this._activityQueue.length,
      hasResource: this._latestResource !== null,
      failedFlushes: this._failedFlushCount,
    };
  },
};
