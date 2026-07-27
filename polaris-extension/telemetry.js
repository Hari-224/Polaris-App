/**
 * Polaris Content Script — Pure Telemetry Emitter
 * 
 * This script collects page telemetry and sends events to the
 * Background Service Worker. It NEVER makes decisions about
 * learning state, productivity, or tracking status.
 * 
 * Responsibilities:
 *   1. Detect page type and navigation (including SPA)
 *   2. Collect YouTube video state (id, position, duration, play/pause)
 *   3. Collect scroll/reading metrics for documentation pages
 *   4. Send heartbeat every 5 seconds
 *   5. Report visibility changes and page unloads
 * 
 * Injected into: YouTube, GeeksforGeeks, LeetCode, MDN, Oracle Docs,
 *                Spring Docs, W3Schools, GitHub, StackOverflow, Dev.to,
 *                Medium, localhost:5173 (Polaris frontend)
 */

(function () {
  'use strict';

  // ─── Guard against duplicate injection ────────────────────
  if (window.__polarisInjected) return;
  window.__polarisInjected = true;

  // ─── State ────────────────────────────────────────────────
  let heartbeatInterval = null;
  let telemetryInterval = null;
  let lastUrl = window.location.href;
  let lastUserActivityTime = Date.now();
  let maxScrollDepth = 0;
  let isFocusActive = false;
  let activityListenersRegistered = false;

  // ─── Safe message sender ─────────────────────────────────
  function sendToBackground(message) {
    try {
      chrome.runtime.sendMessage(message, () => {
        if (chrome.runtime.lastError) { /* Extension context may be invalidated */ }
      });
    } catch (e) {
      // Extension context invalidated (extension reloaded/disabled)
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  1. PAGE INFO & NAVIGATION DETECTION
  // ═══════════════════════════════════════════════════════════

  function emitPageInfo() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    const title = document.title || '';

    // Detect page type
    let pageType = 'article'; // default
    if (hostname.includes('youtube.com')) {
      if (url.includes('/watch')) pageType = 'youtube-watch';
      else if (url.includes('/shorts/')) pageType = 'youtube-shorts';
      else if (url.includes('/playlist')) pageType = 'youtube-playlist';
      else if (url.includes('/live')) pageType = 'youtube-live';
      else pageType = 'youtube-other';
    }

    sendToBackground({
      type: 'PAGE_INFO',
      url,
      hostname,
      title,
      pageType,
    });

    // Reset scroll depth on navigation
    if (url !== lastUrl) {
      maxScrollDepth = 0;
      lastUrl = url;
    }
  }

  // YouTube SPA navigation (yt-navigate-finish fires after YouTube's Polymer router navigates)
  document.addEventListener('yt-navigate-finish', () => {
    // Small delay to let YouTube update the DOM
    setTimeout(emitPageInfo, 300);
  });

  // Generic SPA navigation: monkey-patch history.pushState
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(emitPageInfo, 100);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(emitPageInfo, 100);
  };

  // Browser back/forward
  window.addEventListener('popstate', () => {
    setTimeout(emitPageInfo, 100);
  });

  // ═══════════════════════════════════════════════════════════
  //  2. YOUTUBE VIDEO STATE
  // ═══════════════════════════════════════════════════════════

  function collectVideoState() {
    const hostname = window.location.hostname;
    if (!hostname.includes('youtube.com')) return null;

    const url = window.location.href;
    if (!url.includes('/watch') && !url.includes('/shorts/') && !url.includes('/live')) return null;

    const video = document.querySelector('video');
    if (!video) return null;

    const videoId = extractVideoId(url);
    if (!videoId) return null;

    return {
      type: 'VIDEO_STATE',
      videoId,
      title: getVideoTitle(),
      channel: getChannelName(),
      duration: Math.round(video.duration || 0),
      currentPosition: Math.round(video.currentTime || 0),
      watchPercentage: video.duration > 0 ? Math.round((video.currentTime / video.duration) * 100) : 0,
      playbackState: video.paused ? 'paused' : (video.ended ? 'ended' : 'playing'),
      playbackSpeed: video.playbackRate || 1,
    };
  }

  /**
   * Get YouTube video title with multiple selector fallbacks.
   * YouTube's Polymer components render differently based on page type.
   */
  function getVideoTitle() {
    const selectors = [
      'h1.ytd-watch-metadata yt-formatted-string',
      'h1.style-scope.ytd-watch-metadata',
      '#title h1 yt-formatted-string',
      'ytd-watch-metadata h1',
      'h1.title',
      '#info-contents ytd-video-primary-info-renderer h1',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim()) {
        return el.innerText.trim();
      }
    }

    // Fallback: parse document title (format: "Video Title - YouTube")
    const docTitle = document.title || '';
    if (docTitle.endsWith('- YouTube')) {
      return docTitle.replace(/\s*-\s*YouTube\s*$/, '').trim();
    }
    return docTitle.trim() || 'Unknown Video';
  }

  /**
   * Get YouTube channel name with multiple selector fallbacks.
   */
  function getChannelName() {
    const selectors = [
      '#owner #channel-name a',
      'ytd-channel-name a',
      '#channel-name yt-formatted-string a',
      '#channel-name a',
      'ytd-video-owner-renderer #channel-name a',
      '#top-row ytd-channel-name a',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim()) {
        return el.innerText.trim();
      }
    }
    return 'Unknown Channel';
  }

  // ═══════════════════════════════════════════════════════════
  //  3. SCROLL / READING STATE
  // ═══════════════════════════════════════════════════════════

  function collectScrollState() {
    const hostname = window.location.hostname;
    // Don't track scroll on YouTube (use video state instead)
    if (hostname.includes('youtube.com')) return null;

    return {
      type: 'SCROLL_STATE',
      scrollDepth: maxScrollDepth,
      isVisible: !document.hidden,
      isUserActive: (Date.now() - lastUserActivityTime) < 30000,
    };
  }

  function updateScrollDepth() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      const depth = Math.round((scrollTop / docHeight) * 100);
      if (depth > maxScrollDepth) {
        maxScrollDepth = depth;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  4. USER ACTIVITY TRACKING (for active vs idle)
  // ═══════════════════════════════════════════════════════════

  function registerActivityListeners() {
    if (activityListenersRegistered) return;
    activityListenersRegistered = true;

    const onActivity = () => {
      lastUserActivityTime = Date.now();
    };

    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('scroll', () => {
      onActivity();
      updateScrollDepth();
    }, { passive: true });
    window.addEventListener('click', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
  }

  // ═══════════════════════════════════════════════════════════
  //  5. VISIBILITY & LIFECYCLE EVENTS
  // ═══════════════════════════════════════════════════════════

  document.addEventListener('visibilitychange', () => {
    sendToBackground({
      type: 'VISIBILITY_CHANGE',
      visible: !document.hidden,
    });
  });

  window.addEventListener('beforeunload', () => {
    sendToBackground({ type: 'PAGE_UNLOAD' });
  });

  // ═══════════════════════════════════════════════════════════
  //  6. HEARTBEAT & TELEMETRY INTERVALS
  // ═══════════════════════════════════════════════════════════

  function startTelemetry() {
    if (heartbeatInterval) return; // Already running

    registerActivityListeners();

    // Heartbeat every 5 seconds
    heartbeatInterval = setInterval(() => {
      sendToBackground({ type: 'HEARTBEAT', timestamp: Date.now() });
    }, 5000);

    // Telemetry every 5 seconds
    telemetryInterval = setInterval(() => {
      // YouTube video state
      const videoState = collectVideoState();
      if (videoState) {
        sendToBackground(videoState);
        return; // Don't also send scroll state for YouTube
      }

      // Documentation scroll state
      const scrollState = collectScrollState();
      if (scrollState) {
        sendToBackground(scrollState);
      }
    }, 5000);
  }

  function stopTelemetry() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    if (telemetryInterval) {
      clearInterval(telemetryInterval);
      telemetryInterval = null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  7. MESSAGE LISTENER (from Background)
  // ═══════════════════════════════════════════════════════════

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FOCUS_STATE_CHANGED') {
      isFocusActive = !!message.active;
      if (isFocusActive) {
        startTelemetry();
      } else {
        stopTelemetry();
      }
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  8. AUTHENTICATION MESSAGE FROM WEB APP
  // ═══════════════════════════════════════════════════════════

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'POLARIS_EXTENSION_AUTH_SUCCESS') {
      sendToBackground({
        type: 'SET_AUTH_TOKEN',
        token: event.data.token,
        user: event.data.user,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════
  //  9. INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  // Emit initial page info
  emitPageInfo();

  // Ask background for current focus state
  sendToBackground({ type: 'GET_STATE' });
  try {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.focus && response.focus.active) {
        isFocusActive = true;
        startTelemetry();
      }
    });
  } catch (e) {
    // Extension context invalidated
  }

  // Always send heartbeat (even before focus is confirmed) so background
  // knows the content script is alive
  sendToBackground({ type: 'HEARTBEAT', timestamp: Date.now() });

})();
