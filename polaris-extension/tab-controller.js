/**
 * Polaris Tab Controller
 * 
 * Manages all Chrome tab lifecycle events in one place.
 * Maintains the current active tab context and triggers state machine transitions.
 * Used ONLY by the Background Service Worker.
 */

const TabController = {
  /**
   * Initialize tab event listeners.
   * @param {Function} onTabContextChanged - callback when active tab context changes
   */
  init(onTabContextChanged) {
    this._onContextChanged = onTabContextChanged;

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this._resolveTab(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // Only react when the active tab's URL or status changes
      if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
        this._resolveTab(tabId);
      }
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this._onTabRemoved(tabId);
    });

    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Window lost focus — keep current tracking context active during focus session
        return;
      } else {
        // A Chrome window gained focus — resolve its active tab if it's a normal browser window
        this._resolveActiveTabInWindow(windowId);
      }
    });

    // Resolve initial active tab on startup
    this._resolveCurrentActiveTab();
  },

  /**
   * Handle a PAGE_INFO message from a content script.
   * This is used for SPA navigation detection where the URL changes
   * without triggering tabs.onUpdated.
   * @param {Object} senderTab - the sender.tab from the message
   * @param {Object} pageInfo - { url, hostname, title }
   */
  onPageInfo(senderTab, pageInfo) {
    // Only process if this is the active tab
    if (!senderTab || !senderTab.active) return;

    const domain = classifyDomain(pageInfo.hostname);
    this._onContextChanged({
      tabId: senderTab.id,
      url: pageInfo.url,
      hostname: pageInfo.hostname,
      title: pageInfo.title,
      website: domain ? domain.name : null,
      category: domain ? domain.category : null,
      isProductive: domain !== null,
      windowFocused: true,
    });
  },

  /**
   * Called when a content script reports a navigation event (pushState, popstate).
   * @param {Object} senderTab
   * @param {Object} navInfo - { url, hostname, title }
   */
  onNavigation(senderTab, navInfo) {
    // Same as onPageInfo — treat navigation as a new page context
    this.onPageInfo(senderTab, navInfo);
  },

  // ── Private ──

  _resolveTab(tabId) {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab || !tab.url) return;
      this._processTab(tab);
    });
  },

  _resolveActiveTabInWindow(windowId) {
    chrome.windows.get(windowId, (win) => {
      if (chrome.runtime.lastError || !win || win.type !== 'normal') return;
      chrome.tabs.query({ active: true, windowId }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || !tabs[0]) return;
        this._processTab(tabs[0]);
      });
    });
  },

  _resolveCurrentActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || !tabs[0]) return;
      this._processTab(tabs[0]);
    });
  },

  _processTab(tab) {
    if (!tab || !tab.url) return;
    if (tab.url.startsWith('chrome-extension://') || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
      // Ignore extension popup and internal pages so the tracked learning site is not overwritten
      return;
    }
    try {
      const url = new URL(tab.url);
      const domain = classifyDomain(url.hostname);
      this._onContextChanged({
        tabId: tab.id,
        url: tab.url,
        hostname: url.hostname,
        title: tab.title || '',
        website: domain ? domain.name : null,
        category: domain ? domain.category : null,
        isProductive: domain !== null,
        windowFocused: true,
      });
    } catch (e) {
      // Ignore errors for internal URL parsing
    }
  },

  _onTabRemoved(tabId) {
    if (tabId === this._currentTabId) {
      this._currentTabId = null;
      this._onContextChanged({
        tabId: null,
        removed: true,
        url: null,
        hostname: null,
        title: null,
        website: null,
        category: null,
        isProductive: false,
        windowFocused: true,
      });
    }
  },

  _onContextChanged: null,
};
