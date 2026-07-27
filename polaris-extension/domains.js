/**
 * Polaris Domain Classification Configuration
 * 
 * Single source of truth for productive domain detection.
 * Shared by background service worker and content scripts.
 */

const DOMAIN_CONFIG = [
  { pattern: 'youtube.com',           name: 'YouTube',        category: 'YOUTUBE' },
  { pattern: 'geeksforgeeks.org',     name: 'GeeksforGeeks',  category: 'DOCUMENTATION' },
  { pattern: 'leetcode.com',          name: 'LeetCode',       category: 'PRACTICE' },
  { pattern: 'developer.mozilla.org', name: 'MDN',            category: 'DOCUMENTATION' },
  { pattern: 'docs.oracle.com',       name: 'Oracle Docs',    category: 'DOCUMENTATION' },
  { pattern: 'oracle.com',            name: 'Oracle Docs',    category: 'DOCUMENTATION' },
  { pattern: 'spring.io',             name: 'Spring Docs',    category: 'DOCUMENTATION' },
  { pattern: 'w3schools.com',         name: 'W3Schools',      category: 'DOCUMENTATION' },
  { pattern: 'github.com',            name: 'GitHub',         category: 'CODE' },
  { pattern: 'stackoverflow.com',     name: 'StackOverflow',  category: 'COMMUNITY' },
  { pattern: 'dev.to',               name: 'Dev.to',         category: 'BLOG' },
  { pattern: 'medium.com',           name: 'Medium',         category: 'BLOG' },
];

/**
 * Classify a hostname into a domain category.
 * @param {string} hostname - e.g. "www.youtube.com"
 * @returns {{ name: string, category: string } | null}
 */
function classifyDomain(hostname) {
  if (!hostname) return null;
  const lower = hostname.toLowerCase();
  for (const entry of DOMAIN_CONFIG) {
    if (lower.includes(entry.pattern)) {
      return { name: entry.name, category: entry.category };
    }
  }
  return null;
}

/**
 * Check if a URL belongs to a productive/educational website.
 * @param {string} urlStr - full URL string
 * @returns {boolean}
 */
function isProductiveDomain(urlStr) {
  if (!urlStr) return false;
  try {
    const url = new URL(urlStr);
    return classifyDomain(url.hostname) !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Detect the YouTube page type from a URL.
 * @param {string} urlStr - full URL string
 * @returns {'watch' | 'shorts' | 'playlist' | 'live' | 'embed' | 'channel' | null}
 */
function detectYouTubePageType(urlStr) {
  if (!urlStr) return null;
  try {
    const url = new URL(urlStr);
    if (!url.hostname.includes('youtube.com')) return null;
    const path = url.pathname;
    if (path.includes('/watch')) return 'watch';
    if (path.includes('/shorts/')) return 'shorts';
    if (path.includes('/playlist')) return 'playlist';
    if (path.includes('/live/') || path.includes('/live')) return 'live';
    if (path.includes('/embed/')) return 'embed';
    if (path.startsWith('/@') || path.includes('/channel/') || path.includes('/c/')) return 'channel';
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Extract the video ID from a YouTube URL.
 * @param {string} urlStr - full URL string
 * @returns {string | null}
 */
function extractVideoId(urlStr) {
  if (!urlStr) return null;
  try {
    const url = new URL(urlStr);
    if (url.hostname.includes('youtube.com')) {
      // Standard watch page: ?v=VIDEO_ID
      const vParam = url.searchParams.get('v');
      if (vParam) return vParam;

      // Shorts: /shorts/VIDEO_ID
      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) return shortsMatch[1];

      // Embed: /embed/VIDEO_ID
      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) return embedMatch[1];

      // Live: /live/VIDEO_ID
      const liveMatch = url.pathname.match(/\/live\/([a-zA-Z0-9_-]+)/);
      if (liveMatch) return liveMatch[1];
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Format seconds into a human-readable duration string.
 * @param {number} seconds
 * @returns {string}
 */
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
