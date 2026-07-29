/**
 * Polaris Background Service Worker — Central Controller
 * 
 * This is the SINGLE SOURCE OF TRUTH for the entire extension.
 * All state decisions are made here. All other components are either
 * telemetry emitters (content script) or view layers (popup).
 * 
 * Architecture:
 *   Content Script → (events) → Background → (state) → chrome.storage.local → Popup reads
 *                                           → (batched) → API Client → Backend
 */

importScripts('domains.js', 'storage.js', 'state-machine.js', 'api.js', 'tab-controller.js', 'tracking-queue.js', 'heartbeat.js');

console.log('[Polaris] Background service worker initialized');

// ═══════════════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize all subsystems on service worker startup.
 * Restores state from chrome.storage.local (survives MV3 restarts).
 */
async function initialize() {
  const state = await StorageManager.getState();
  console.log('[Polaris] Restored state:', state.context.learningState);

  // Initialize Tab Controller
  TabController.init(onTabContextChanged);

  // Initialize Heartbeat Monitor
  HeartbeatMonitor.init({
    onLost: onHeartbeatLost,
    onResumed: onHeartbeatResumed,
  });

  // Setup chrome.alarms (survives MV3 service worker termination)
  chrome.alarms.create('heartbeat-check', { periodInMinutes: 0.25 });     // 15 seconds
  chrome.alarms.create('queue-flush', { periodInMinutes: 1 / 6 });        // 10 seconds
  chrome.alarms.create('backend-sync', { periodInMinutes: 1 / 6 });        // 10 seconds
  chrome.alarms.create('study-time-tick', { periodInMinutes: 1 / 12 });   // 5 seconds

  // If authenticated, do an immediate backend sync
  if (state.auth.token) {
    syncWithBackend();
  } else {
    checkDeviceAuth();
  }
}

// ═══════════════════════════════════════════════════════════════
//  CHROME ALARMS (replaces setInterval — survives MV3 restarts)
// ═══════════════════════════════════════════════════════════════

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const state = await StorageManager.getState();

  switch (alarm.name) {
    case 'heartbeat-check':
      HeartbeatMonitor.check(state.context.tabId);
      break;

    case 'queue-flush':
      if (state.auth.token) {
        await TrackingQueue.flush(state.auth.token);
      }
      break;

    case 'backend-sync':
      if (state.auth.token) {
        await syncWithBackend();
      } else {
        await checkDeviceAuth();
      }
      break;

    case 'study-time-tick':
      await onStudyTimeTick(state);
      break;
  }
});

// ═══════════════════════════════════════════════════════════════
//  MESSAGE ROUTER
// ═══════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    // ── Content Script Telemetry ──

    case 'PAGE_INFO':
      TabController.onPageInfo(sender.tab, message);
      break;

    case 'NAVIGATION':
      TabController.onNavigation(sender.tab, message);
      break;

    case 'VIDEO_STATE':
      handleVideoState(message, sender.tab);
      break;

    case 'SCROLL_STATE':
      handleScrollState(message, sender.tab);
      break;

    case 'HEARTBEAT':
      HeartbeatMonitor.onPing(sender.tab ? sender.tab.id : null);
      break;

    case 'VISIBILITY_CHANGE':
      handleVisibilityChange(message, sender.tab);
      break;

    case 'PAGE_UNLOAD':
      handlePageUnload(sender.tab);
      break;

    // ── Popup Commands ──

    case 'START_FOCUS':
      handleStartFocus(message, sendResponse);
      return true; // async sendResponse

    case 'STOP_FOCUS':
      handleStopFocus(sendResponse);
      return true;

    case 'GET_STATE':
      StorageManager.getState().then((state) => {
        sendResponse(state);
      });
      return true;

    // ── Auth ──

    case 'CHECK_AUTH':
      checkDeviceAuth().then(() => sendResponse({ success: true }));
      return true;

    case 'SET_AUTH_TOKEN':
      handleSetAuthToken(message).then(() => sendResponse({ success: true }));
      return true;

    case 'AUTH_LOGOUT':
      StorageManager.clearAuth().then(() => sendResponse({ success: true }));
      return true;

    default:
      console.warn('[Polaris] Unknown message type:', message.type);
  }
});

// ═══════════════════════════════════════════════════════════════
//  TAB CONTEXT CHANGED (from TabController)
// ═══════════════════════════════════════════════════════════════

async function onTabContextChanged(tabContext) {
  const state = await StorageManager.getState();

  // Handle tab removal
  if (tabContext.removed && tabContext.tabId === state.context.tabId) {
    // The tracked tab was closed — resolve what's now active
    await StorageManager.updateState({
      context: {
        tabId: null,
        url: null,
        hostname: null,
        website: null,
        category: null,
        isProductive: false,
      },
      video: DEFAULT_STATE ? { videoId: null, title: null, channel: null, duration: 0, currentPosition: 0, watchPercentage: 0, playbackState: null, watchUrl: null } : {},
      article: { url: null, title: null, scrollDepth: 0, readingTimeSeconds: 0, activeTimeSeconds: 0, idleTimeSeconds: 0 },
    });
    // Transition state machine
    await applyTransition(EVENTS.TAB_CHANGED, { isProductive: false });
    HeartbeatMonitor.removeTab(tabContext.tabId);
    return;
  }

  // Check if the context actually changed
  const contextChanged = tabContext.url !== state.context.url ||
                          tabContext.tabId !== state.context.tabId;

  if (!contextChanged && tabContext.windowFocused !== false) return;

  // Clear video/article state when navigating to a different page
  const urlChanged = tabContext.url !== state.context.url;
  const stateUpdate = {
    context: {
      tabId: tabContext.tabId,
      url: tabContext.url,
      hostname: tabContext.hostname,
      website: tabContext.website,
      category: tabContext.category,
      isProductive: tabContext.isProductive,
    },
  };

  if (urlChanged) {
    // Flush any pending data for the previous page before clearing
    if (state.auth.token && state.focus.active) {
      await TrackingQueue.flush(state.auth.token);
    }

    // Clear video state if leaving a YouTube watch page
    const wasYouTube = state.context.category === 'YOUTUBE';
    const isYouTube = tabContext.category === 'YOUTUBE';
    if (wasYouTube && !isYouTube) {
      stateUpdate.video = { videoId: null, title: null, channel: null, duration: 0, currentPosition: 0, watchPercentage: 0, playbackState: null, watchUrl: null };
    }

    // Clear article state if leaving a documentation page
    if (!isYouTube) {
      stateUpdate.article = { url: tabContext.url, title: tabContext.title || '', scrollDepth: 0, readingTimeSeconds: 0, activeTimeSeconds: 0, idleTimeSeconds: 0 };
    }
  }

  await StorageManager.updateState(stateUpdate);

  // Apply state machine transition
  await applyTransition(EVENTS.TAB_CHANGED, { isProductive: tabContext.isProductive });
}

// ═══════════════════════════════════════════════════════════════
//  VIDEO STATE (from Content Script)
// ═══════════════════════════════════════════════════════════════

async function handleVideoState(message, senderTab) {
  if (!senderTab) return;

  const state = await StorageManager.getState();
  if (!state.auth.token) return;

  const watchUrl = message.videoId ? `https://www.youtube.com/watch?v=${message.videoId}` : state.video.watchUrl;
  const currentPos = message.currentPosition || 0;
  const resumeUrl = watchUrl && currentPos > 0 ? `${watchUrl}&t=${currentPos}` : watchUrl;

  // Update video state in storage
  const videoUpdate = {
    video: {
      videoId: message.videoId || state.video.videoId,
      title: message.title || state.video.title,
      channel: message.channel || state.video.channel,
      duration: message.duration || state.video.duration,
      currentPosition: currentPos,
      watchPercentage: message.watchPercentage || 0,
      playbackState: message.playbackState || state.video.playbackState,
      watchUrl: watchUrl,
      resumeUrl: resumeUrl,
    },
  };

  await StorageManager.updateState(videoUpdate);

  // Enqueue resource tracking to backend
  if (message.videoId) {
    TrackingQueue.updateResource({
      sessionId: state.focus.sessionId || null,
      dayId: state.focus.dayId || state.planner.dayId || null,
      resourceUrl: watchUrl,
      resourceTitle: videoUpdate.video.title,
      channelName: videoUpdate.video.channel,
      videoId: message.videoId,
      duration: message.duration || 0,
      currentPosition: currentPos,
      watchPercentage: message.watchPercentage || 0,
      resourceType: 'YouTube',
    });
    // Flush tracking queue to Spring Boot backend immediately (3s cycle)
    TrackingQueue.flush(state.auth.token);
  }
}

// ═══════════════════════════════════════════════════════════════
//  SCROLL / ARTICLE STATE (from Content Script)
// ═══════════════════════════════════════════════════════════════

async function handleScrollState(message, senderTab) {
  if (!senderTab || !senderTab.active) return;

  const state = await StorageManager.getState();
  if (!state.focus.active) return;
  if (state.context.category === 'YOUTUBE') return; // YouTube uses video state, not scroll

  const newScrollDepth = Math.max(message.scrollDepth || 0, state.article.scrollDepth || 0);

  await StorageManager.updateState({
    article: {
      scrollDepth: newScrollDepth,
    },
  });

  // Enqueue resource tracking for documentation
  if (state.focus.sessionId && state.context.isProductive) {
    TrackingQueue.updateResource({
      sessionId: state.focus.sessionId,
      dayId: state.focus.dayId,
      resourceUrl: state.context.url,
      resourceTitle: state.article.title || state.context.url,
      watchPercentage: newScrollDepth,
      resourceType: state.context.website || 'Documentation',
    });
  }
}

// ═══════════════════════════════════════════════════════════════
//  VISIBILITY CHANGE (from Content Script)
// ═══════════════════════════════════════════════════════════════

async function handleVisibilityChange(message, senderTab) {
  if (!senderTab) return;
  // Visibility changes are primarily handled via tab events.
  // This provides an additional signal for the same-tab case.
  if (!message.visible) {
    // Tab became hidden (user switched to another tab/window)
    // The tab controller will handle this via onActivated
  }
}

// ═══════════════════════════════════════════════════════════════
//  PAGE UNLOAD (from Content Script)
// ═══════════════════════════════════════════════════════════════

async function handlePageUnload(senderTab) {
  if (!senderTab) return;
  const state = await StorageManager.getState();

  // Flush pending data before the page unloads
  if (state.auth.token && state.focus.active) {
    await TrackingQueue.flush(state.auth.token);
  }
}

// ═══════════════════════════════════════════════════════════════
//  HEARTBEAT CALLBACKS
// ═══════════════════════════════════════════════════════════════

async function onHeartbeatLost(tabId) {
  console.log('[Polaris] Heartbeat lost for tab', tabId);
  const state = await StorageManager.getState();

  await StorageManager.updateState({
    heartbeat: { lastPing: state.heartbeat.lastPing, contentScriptAlive: false },
  });

  await applyTransition(EVENTS.HEARTBEAT_LOST, {});
}

async function onHeartbeatResumed(tabId) {
  console.log('[Polaris] Heartbeat resumed for tab', tabId);
  await StorageManager.updateState({
    heartbeat: { lastPing: Date.now(), contentScriptAlive: true },
  });

  // Only resume tracking if on a productive site
  const state = await StorageManager.getState();
  if (state.context.isProductive) {
    await applyTransition(EVENTS.HEARTBEAT_RESUMED, {});
  }
}

// ═══════════════════════════════════════════════════════════════
//  STUDY TIME TICK (every 5 seconds)
// ═══════════════════════════════════════════════════════════════

async function onStudyTimeTick(state) {
  if (!state.focus.active) return;
  if (state.context.learningState !== PolarisStateMachine.STATES.FOCUSED_TRACKING) return;

  // Increment study time by 5 seconds
  const newStudyTime = (state.metrics.todayStudyTimeSeconds || 0) + 5;
  await StorageManager.updateState({
    metrics: { todayStudyTimeSeconds: newStudyTime },
  });

  // Increment article active/idle time for documentation pages
  if (state.context.category !== 'YOUTUBE' && state.context.isProductive) {
    const articleActiveTime = (state.article.activeTimeSeconds || 0) + 5;
    await StorageManager.updateState({
      article: { activeTimeSeconds: articleActiveTime },
    });
  }

  // Enqueue activity tracking
  TrackingQueue.enqueueActivity({
    sessionId: state.focus.sessionId,
    website: state.context.hostname,
    url: state.context.url,
    pageTitle: state.context.website || state.context.hostname || 'Unknown',
    activeTimeSeconds: 5,
    activityType: state.context.category || 'LEARNING',
  });
}

// ═══════════════════════════════════════════════════════════════
//  FOCUS SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

async function handleStartFocus(message, sendResponse) {
  const state = await StorageManager.getState();
  if (!state.auth.token) {
    sendResponse({ success: false, error: 'Not authenticated' });
    return;
  }

  const res = await ExtensionAPI.startFocus(message.dayId, state.auth.token);

  if (res && res.authExpired) {
    await handleAuthExpired();
    sendResponse({ success: false, error: 'Authentication expired' });
    return;
  }

  if (res && res.success && res.data) {
    await StorageManager.setFocusSession(res.data);

    // Update planner context from the session response
    if (res.data.dayId || res.data.dayTitle) {
      await StorageManager.updateState({
        planner: {
          planId: res.data.planId || state.planner.planId,
          planTopic: res.data.planTopic || state.planner.planTopic,
          dayId: res.data.dayId,
          dayNumber: res.data.dayNumber,
          dayTitle: res.data.dayTitle,
          estimatedMinutes: res.data.estimatedStudyMinutes || state.planner.estimatedMinutes,
        }
      });
    }

    // Apply state machine transition
    const currentState = await StorageManager.getState();
    await applyTransition(EVENTS.FOCUS_STARTED, {
      isProductive: currentState.context.isProductive,
    });

    // Notify content scripts
    notifyAllContentScripts('FOCUS_STATE_CHANGED', { active: true });

    sendResponse({ success: true, session: res.data });
  } else {
    sendResponse({ success: false, error: (res && res.message) || 'Failed to start Focus Session' });
  }
}

async function handleStopFocus(sendResponse) {
  const state = await StorageManager.getState();

  // Flush any remaining tracking data
  if (state.auth.token) {
    await TrackingQueue.flush(state.auth.token);
  }

  const sessionId = state.focus.sessionId;
  const res = await ExtensionAPI.endFocus(sessionId, state.auth.token);

  if (res && res.authExpired) {
    await handleAuthExpired();
    sendResponse({ success: false, error: 'Authentication expired' });
    return;
  }

  // Clear focus session and tracking state
  await StorageManager.setFocusSession(null);
  TrackingQueue.clear();

  // Apply state machine transition
  await applyTransition(EVENTS.FOCUS_STOPPED, {});

  // Notify content scripts
  notifyAllContentScripts('FOCUS_STATE_CHANGED', { active: false });

  sendResponse({ success: true });
}

// ═══════════════════════════════════════════════════════════════
//  STATE MACHINE TRANSITION
// ═══════════════════════════════════════════════════════════════

async function applyTransition(event, context) {
  const state = await StorageManager.getState();
  const currentLearningState = state.context.learningState || PolarisStateMachine.STATES.NOT_AUTHENTICATED;

  const { newState, changed } = PolarisStateMachine.transition(currentLearningState, event, context);

  if (changed) {
    await StorageManager.updateState({
      context: { learningState: newState },
    });
    console.log(`[Polaris] Learning state: ${currentLearningState} → ${newState}`);
  }
}

// ═══════════════════════════════════════════════════════════════
//  AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

async function checkDeviceAuth() {
  const state = await StorageManager.getState();
  if (state.auth.token) {
    // Already authenticated — sync instead
    return syncWithBackend();
  }

  const deviceId = await StorageManager.getDeviceId();
  const res = await ExtensionAPI.checkAuthStatus(deviceId);

  if (res && res.success && res.data && res.data.authorized && res.data.token) {
    console.log('[Polaris] Device authorization confirmed');
    await StorageManager.setAuth(
      res.data.token,
      {
        email: res.data.email,
        firstName: res.data.studentName,
        role: res.data.role,
      },
      {
        refreshToken: res.data.refreshToken,
        deviceId: res.data.deviceId || deviceId,
        studentId: res.data.studentId,
        authTimestamp: res.data.authTimestamp,
      }
    );
    await applyTransition(EVENTS.AUTH_GAINED, {});
    await syncWithBackend();
  }
}

async function handleSetAuthToken(message) {
  if (message.token) {
    await StorageManager.setAuth(message.token, message.user || null);
    await applyTransition(EVENTS.AUTH_GAINED, {});
    await syncWithBackend();
  }
}

async function handleAuthExpired() {
  console.warn('[Polaris] Authentication expired');
  await StorageManager.clearAuth();
  TrackingQueue.clear();
  await applyTransition(EVENTS.AUTH_LOST, {});
  notifyAllContentScripts('FOCUS_STATE_CHANGED', { active: false });
}

// ═══════════════════════════════════════════════════════════════
//  BACKEND SYNC (periodic, every 60 seconds)
// ═══════════════════════════════════════════════════════════════

async function syncWithBackend() {
  const state = await StorageManager.getState();
  if (!state.auth.token) return;

  // Sync extension context (user info, plan, day, metrics, focus state)
  const res = await ExtensionAPI.getExtensionContext(state.auth.token);

  if (res && res.authExpired) {
    await handleAuthExpired();
    return;
  }

  if (!res || !res.success || !res.data) return;

  const data = res.data;

  // Reset flush failure counter on successful backend contact
  TrackingQueue.resetFailures();

  const syncUpdate = {
    metrics: {
      todayStudyTimeSeconds: data.todayStudyTimeSeconds || state.metrics.todayStudyTimeSeconds || 0,
      focusScore: data.focusScore || state.metrics.focusScore || 85,
    },
  };

  // Sync planner context
  if (data.planTopic || data.dayTitle) {
    syncUpdate.planner = {
      planId: data.planId || state.planner.planId,
      planTopic: data.planTopic || state.planner.planTopic,
      dayId: data.dayId || state.planner.dayId,
      dayNumber: data.dayNumber || state.planner.dayNumber,
      dayTitle: data.dayTitle || state.planner.dayTitle,
      estimatedMinutes: data.estimatedStudyMinutes || state.planner.estimatedMinutes,
    };
  }

  // Sync focus session state from backend
  const backendFocusActive = data.focusStatus === 'ACTIVE';
  if (backendFocusActive) {
    // Sync active session context from backend
    syncUpdate.focus = {
      active: true,
      sessionId: data.activeSessionId,
      dayId: data.dayId || state.focus.dayId || null,
      startTime: state.focus.startTime || new Date().toISOString(),
    };
  } else if (!backendFocusActive && state.focus.active) {
    // Backend says focus is NOT active but extension thinks it is — sync it
    syncUpdate.focus = { active: false, sessionId: null, dayId: null, startTime: null };
    syncUpdate.video = { videoId: null, title: null, channel: null, duration: 0, currentPosition: 0, watchPercentage: 0, playbackState: null, watchUrl: null };
    syncUpdate.article = { url: null, title: null, scrollDepth: 0, readingTimeSeconds: 0, activeTimeSeconds: 0, idleTimeSeconds: 0 };
    TrackingQueue.clear();
    notifyAllContentScripts('FOCUS_STATE_CHANGED', { active: false });
  }

  await StorageManager.updateState(syncUpdate);

  // Re-evaluate state machine after sync
  const updatedState = await StorageManager.getState();
  if (updatedState.focus.active) {
    await applyTransition(EVENTS.TAB_CHANGED, { isProductive: updatedState.context.isProductive });
  } else if (!backendFocusActive && state.focus.active) {
    await applyTransition(EVENTS.FOCUS_STOPPED, {});
  }
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Notify all tabs that have a content script running.
 * @param {string} type - message type
 * @param {Object} payload - message payload
 */
function notifyAllContentScripts(type, payload = {}) {
  chrome.tabs.query({}, (tabs) => {
    if (!tabs) return;
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type, ...payload }, () => {
        if (chrome.runtime.lastError) { /* Content script not injected in this tab */ }
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════════════════════════════

initialize();

// Repeating flush timer to sync telemetry to Spring Boot every 3 seconds
setInterval(async () => {
  try {
    const state = await StorageManager.getState();
    if (state && state.auth && state.auth.token) {
      await TrackingQueue.flush(state.auth.token);
    }
  } catch (e) {
    // Ignore async background storage errors
  }
}, 3000);
