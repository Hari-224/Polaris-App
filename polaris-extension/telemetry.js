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

  // ─── Listen for auth success postMessage from Polaris web app ───
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'POLARIS_AUTH_SUCCESS') {
      sendToBackground({ type: 'CHECK_AUTH' });
    }
  });

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

    // Heartbeat every 3 seconds
    heartbeatInterval = setInterval(() => {
      sendToBackground({ type: 'HEARTBEAT', timestamp: Date.now() });
    }, 3000);

    // Telemetry every 3 seconds
    telemetryInterval = setInterval(() => {
      // YouTube video state
      const videoState = collectVideoState();
      if (videoState) {
        try {
          chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
            if (chrome.runtime.lastError || !state) {
              sendToBackground(videoState);
              return;
            }
            const isRelevant = checkVideoRelevanceAndEnforce(videoState, state);
            if (isRelevant) {
              sendToBackground(videoState);
            }
          });
        } catch (e) {
          sendToBackground(videoState);
        }
        return; // Don't also send scroll state for YouTube
      }

      // Documentation scroll state
      const scrollState = collectScrollState();
      if (scrollState) {
        sendToBackground(scrollState);
      }
    }, 3000);
  }

  // ─── POLARIS FOCUS GUARD: Irrelevant Video Detection & Restriction ───
  function checkVideoRelevanceAndEnforce(videoState, state) {
    if (!state || !state.focus || !state.focus.active) {
      removeFocusGuardOverlay();
      return true;
    }

    const title = (videoState.title || document.title || '').toLowerCase();
    if (!title || title.includes('loading') || title === 'youtube') return true;

    const activeTopic = (state.planner && state.planner.topic) ||
                        (state.focus && state.focus.topic) || '';
    const topicLower = activeTopic.toLowerCase().trim();

    // Distraction & Gaming Keywords
    const distractionKeywords = [
      'freefire', 'free fire', 'pubg', 'bgmi', 'gameplay', 'fortnite', 'gta',
      'roblox', 'minecraft', 'vlog', 'prank', 'song', 'music video', 'trailer',
      'movie', 'roast', 'gaming', 'highlights', 'funny', 'shorts', 'tiktok', 'reels',
      '30 kill', 'headshot', 'solo vs squad'
    ];

    // Educational / Technical Keywords
    const educationalKeywords = [
      'spring', 'springboot', 'java', 'python', 'javascript', 'react', 'node',
      'sql', 'database', 'tutorial', 'course', 'guide', 'explained', 'architecture',
      'developer', 'coding', 'programming', 'api', 'microservices', 'framework',
      'learn', 'setup', 'config', 'properties', 'system design', 'data structures',
      'algorithms', 'web', 'dev', 'backend', 'frontend', 'docker', 'kubernetes', 'aws', 'git'
    ];

    const isDistraction = distractionKeywords.some(kw => title.includes(kw));

    let matchesTopic = false;
    if (topicLower.length > 0) {
      const topicWords = topicLower.split(/\s+/).filter(w => w.length > 2);
      matchesTopic = topicWords.some(w => title.includes(w));
    }
    const isEducational = educationalKeywords.some(kw => title.includes(kw));

    if (isDistraction || (!matchesTopic && !isEducational)) {
      const videoEl = document.querySelector('video');
      if (videoEl && !videoEl.paused) {
        videoEl.pause();
      }
      showFocusGuardOverlay(videoState.title || title, activeTopic || 'your learning topic');
      return false;
    } else {
      removeFocusGuardOverlay();
      return true;
    }
  }

  function showFocusGuardOverlay(videoTitle, topicTitle) {
    let overlay = document.getElementById('polaris-focus-guard');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'polaris-focus-guard';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(3, 7, 18, 0.96);
        backdrop-filter: blur(16px);
        z-index: 9999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        padding: 24px;
        box-sizing: border-box;
      `;
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 9999px; padding: 8px 18px; margin-bottom: 20px; color: #f87171; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);">
        🛡️ Polaris Focus Shield Active
      </div>
      <h2 style="font-size: 26px; font-weight: 800; margin: 0 0 12px 0; color: #ffffff; letter-spacing: -0.02em;">
        Irrelevant Content Blocked
      </h2>
      <p style="font-size: 15px; color: #9ca3af; max-width: 540px; margin: 0 0 24px 0; line-height: 1.6;">
        You are in an active Focus Session for <strong style="color: #38bdf8;">"${topicTitle}"</strong>.<br>
        <span style="font-size: 13px; color: #6b7280; display: block; margin-top: 8px; font-style: italic;">Video: "${videoTitle}"</span>
      </p>
      <div style="display: flex; gap: 14px;">
        <button id="polaris-btn-return-planner" style="background: linear-gradient(135deg, #0ea5e9, #6366f1); border: none; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);">
          Return to Learning Dashboard
        </button>
      </div>
    `;

    document.getElementById('polaris-btn-return-planner')?.addEventListener('click', () => {
      window.location.href = 'http://localhost:5173/planner/5';
    });
  }

  function removeFocusGuardOverlay() {
    const overlay = document.getElementById('polaris-focus-guard');
    if (overlay) overlay.remove();
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

  // Always start telemetry for active tracking every 3 seconds
  startTelemetry();

  // Send initial heartbeat
  sendToBackground({ type: 'HEARTBEAT', timestamp: Date.now() });

})();
