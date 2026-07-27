/**
 * Polaris Popup — Pure View Layer
 * 
 * This popup is a READ-ONLY view of the centralized polaris_state.
 * It NEVER queries tabs, calls the backend API, or determines learning state.
 * 
 * Data Source: chrome.storage.local (polaris_state)
 * Commands:   chrome.runtime.sendMessage → Background Service Worker
 * Live Updates: chrome.storage.onChanged
 */

document.addEventListener('DOMContentLoaded', () => {
  // ─── DOM References ─────────────────────────────────────
  const unauthView = document.getElementById('unauthView');
  const authView = document.getElementById('authView');
  const offlineBanner = document.getElementById('offlineBanner');
  const connectBtn = document.getElementById('connectBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const focusBtn = document.getElementById('focusBtn');

  const trackingBadge = document.getElementById('trackingBadge');
  const badgeDot = document.getElementById('badgeDot');
  const badgeText = document.getElementById('badgeText');

  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userRole = document.getElementById('userRole');

  const currentWebsite = document.getElementById('currentWebsite');
  const currentPlan = document.getElementById('currentPlan');
  const currentTask = document.getElementById('currentTask');
  const todayStudyTime = document.getElementById('todayStudyTime');
  const focusScore = document.getElementById('focusScore');

  // ─── Render UI from polaris_state ───────────────────────
  function renderUI(state) {
    if (!state) {
      showUnauth();
      return;
    }

    // Auth check
    if (!state.auth || !state.auth.token) {
      showUnauth();
      return;
    }

    // Show authenticated view
    unauthView.style.display = 'none';
    authView.style.display = 'block';
    offlineBanner.style.display = 'none';

    // User info
    const user = state.auth.user;
    if (user) {
      userName.innerText = user.firstName || 'Polaris Student';
      userEmail.innerText = user.email || '';
      userRole.innerText = user.role || 'STUDENT';
    }

    // Current Website (from background's context)
    const ctx = state.context || {};
    if (ctx.website) {
      currentWebsite.innerText = ctx.website;
      currentWebsite.style.color = '#f3f4f6';
    } else {
      currentWebsite.innerText = 'Not Learning';
      currentWebsite.style.color = '#9ca3af';
    }

    // Tracking badge (from learning state)
    renderBadge(ctx.learningState);

    // Focus session info
    const focus = state.focus || {};
    const planner = state.planner || {};
    const isFocusActive = !!focus.active;

    if (isFocusActive && ctx.isProductive) {
      // Active tracking on a productive site
      if (planner.planTopic) {
        currentPlan.innerText = planner.planTopic;
        currentPlan.style.color = '#38bdf8';
      } else {
        currentPlan.innerText = 'Active Learning Session';
        currentPlan.style.color = '#38bdf8';
      }

      if (planner.dayTitle) {
        currentTask.innerText = `Day ${planner.dayNumber || 1}: ${planner.dayTitle}`;
      } else {
        currentTask.innerText = 'Learning Task Active';
      }
    } else if (isFocusActive && !ctx.isProductive) {
      // Focus active but on a non-productive site
      currentPlan.innerText = planner.planTopic || 'Focus Session Active';
      currentPlan.style.color = '#fbbf24';
      currentTask.innerText = 'Learning Paused (Non-Educational Website)';
    } else {
      // No focus session
      currentPlan.innerText = 'No Active Learning';
      currentPlan.style.color = '#9ca3af';
      currentTask.innerText = 'No Focus Session Running';
    }

    // Metrics
    const metrics = state.metrics || {};
    todayStudyTime.innerText = formatDuration(metrics.todayStudyTimeSeconds || 0);
    focusScore.innerText = `${Math.round(metrics.focusScore || 85)}%`;

    // Focus button
    if (isFocusActive) {
      focusBtn.innerText = 'Stop Focus Session';
      focusBtn.className = 'btn btn-stop';
    } else {
      focusBtn.innerText = 'Start Focus Session';
      focusBtn.className = 'btn btn-primary';
    }
  }

  function renderBadge(learningState) {
    switch (learningState) {
      case 'FOCUSED_TRACKING':
        trackingBadge.className = 'badge badge-tracking';
        badgeDot.className = 'dot dot-green';
        badgeText.innerText = 'Tracking';
        break;
      case 'FOCUSED_PAUSED':
        trackingBadge.className = 'badge badge-paused';
        badgeDot.className = 'dot dot-yellow';
        badgeText.innerText = 'Paused';
        break;
      case 'FOCUSED_IDLE':
        trackingBadge.className = 'badge badge-paused';
        badgeDot.className = 'dot dot-yellow';
        badgeText.innerText = 'Idle';
        break;
      case 'IDLE':
        trackingBadge.className = 'badge badge-idle';
        badgeDot.className = 'dot dot-gray';
        badgeText.innerText = 'Idle';
        break;
      case 'NOT_AUTHENTICATED':
        trackingBadge.className = 'badge badge-offline';
        badgeDot.className = 'dot dot-red';
        badgeText.innerText = 'Offline';
        break;
      default:
        trackingBadge.className = 'badge badge-idle';
        badgeDot.className = 'dot dot-gray';
        badgeText.innerText = 'Idle';
    }
  }

  function showUnauth() {
    unauthView.style.display = 'block';
    authView.style.display = 'none';
    offlineBanner.style.display = 'none';
    trackingBadge.className = 'badge badge-offline';
    badgeDot.className = 'dot dot-red';
    badgeText.innerText = 'Offline';
  }

  // ─── Initial State Load ─────────────────────────────────
  chrome.storage.local.get('polaris_state', (res) => {
    renderUI(res.polaris_state || null);
  });

  // ─── Live Updates via storage.onChanged ─────────────────
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.polaris_state) {
      renderUI(changes.polaris_state.newValue);
    }
  });

  // ─── Focus Button ───────────────────────────────────────
  focusBtn.addEventListener('click', () => {
    // Read current state to determine action
    chrome.storage.local.get('polaris_state', (res) => {
      const state = res.polaris_state || {};
      const isFocusActive = state.focus && state.focus.active;

      if (isFocusActive) {
        chrome.runtime.sendMessage({ type: 'STOP_FOCUS' }, () => {
          // State will update via storage.onChanged — no manual refresh needed
        });
      } else {
        const dayId = (state.planner && state.planner.dayId) ||
                       (state.focus && state.focus.dayId) || null;
        chrome.runtime.sendMessage({ type: 'START_FOCUS', dayId }, () => {
          // State will update via storage.onChanged
        });
      }
    });
  });

  // ─── Connect Button ────────────────────────────────────
  connectBtn.addEventListener('click', async () => {
    // Generate or retrieve device ID, then open auth page
    chrome.storage.local.get('polaris_state', (res) => {
      const state = res.polaris_state || {};
      const deviceId = (state.auth && state.auth.deviceId) || null;

      if (deviceId) {
        openAuthPage(deviceId);
      } else {
        // Ask background to ensure device ID exists
        chrome.runtime.sendMessage({ type: 'GET_STATE' }, (bgState) => {
          const id = bgState && bgState.auth && bgState.auth.deviceId;
          if (id) {
            openAuthPage(id);
          } else {
            // Fallback: generate one
            const newId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
            openAuthPage(newId);
          }
        });
      }
    });
  });

  function openAuthPage(deviceId) {
    const authUrl = `http://localhost:5173/extension-auth?device_id=${encodeURIComponent(deviceId)}`;
    chrome.tabs.create({ url: authUrl });
  }

  // ─── Dashboard Button ──────────────────────────────────
  dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard' });
  });
});
