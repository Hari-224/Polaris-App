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
        // All Chrome windows lost focus (user switched to another app)
        this._onContextChanged({
          tabId: null,
          url: null,
          hostname: null,
          title: null,
          website: null,
          category: null,
          isProductive: false,
          windowFocused: false,
        });
      } else {
        // A Chrome window gained focus — resolve its active tab
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
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || !tabs[0]) return;
      this._processTab(tabs[0]);
    });
  },

  _resolveCurrentActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || !tabs[0]) return;
      this._processTab(tabs[0]);
    });
  },

  _processTab(tab) {
    if (!tab.url) return;
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
      // Internal chrome:// or edge:// pages — treat as non-productive
      this._onContextChanged({
        tabId: tab.id,
        url: tab.url,
        hostname: null,
        title: tab.title || '',
        website: null,
        category: null,
        isProductive: false,
        windowFocused: true,
      });
    }
  },

  _onTabRemoved(tabId) {
    // Notify background that a tab was removed so it can check if
    // it was the currently tracked tab
    this._onContextChanged({
      tabId: tabId,
      removed: true,
      url: null,
      hostname: null,
      title: null,
      website: null,
      category: null,
      isProductive: false,
      windowFocused: true,
    });
  },

  _onContextChanged: null,
};
