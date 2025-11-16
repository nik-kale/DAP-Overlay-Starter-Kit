/**
 * Security utilities for sanitizing HTML and preventing XSS
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content using DOMPurify
 * Removes script tags, event handlers, and other potentially dangerous content
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'a',
      'ul',
      'ol',
      'li',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Validate that a CSS selector is safe (basic validation)
 * Prevents injection of dangerous selectors
 */
export function validateSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  // Disallow script-related selectors
  const dangerous = ['script', 'javascript:', 'data:', 'vbscript:'];
  const lower = selector.toLowerCase();

  for (const term of dangerous) {
    if (lower.includes(term)) {
      return false;
    }
  }

  return true;
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
