const PRODUCTIVE_DOMAINS = [
  'youtube.com',
  'geeksforgeeks.org',
  'leetcode.com',
  'developer.mozilla.org',
  'docs.oracle.com',
  'spring.io',
  'docs.spring.io',
  'w3schools.com',
  'github.com',
  'stackoverflow.com'
];

function getDomainCategory(hostname) {
  if (!hostname) return null;
  const lower = hostname.toLowerCase();

  if (lower.includes('youtube.com')) return { category: 'YOUTUBE', name: 'YouTube' };
  if (lower.includes('geeksforgeeks.org')) return { category: 'DOCUMENTATION', name: 'GeeksforGeeks' };
  if (lower.includes('leetcode.com')) return { category: 'PRACTICE', name: 'LeetCode' };
  if (lower.includes('developer.mozilla.org')) return { category: 'DOCUMENTATION', name: 'MDN' };
  if (lower.includes('oracle.com')) return { category: 'DOCUMENTATION', name: 'Oracle Docs' };
  if (lower.includes('spring.io')) return { category: 'DOCUMENTATION', name: 'Spring Docs' };
  if (lower.includes('w3schools.com')) return { category: 'DOCUMENTATION', name: 'W3Schools' };
  if (lower.includes('github.com')) return { category: 'CODE', name: 'GitHub' };
  if (lower.includes('stackoverflow.com')) return { category: 'COMMUNITY', name: 'StackOverflow' };

  return null;
}

function isProductiveWebsite(urlStr) {
  if (!urlStr) return false;
  try {
    const url = new URL(urlStr);
    return PRODUCTIVE_DOMAINS.some(domain => url.hostname.toLowerCase().includes(domain));
  } catch (e) {
    return false;
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// Global export for content scripts and background service worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTIVE_DOMAINS, getDomainCategory, isProductiveWebsite, formatDuration };
}
