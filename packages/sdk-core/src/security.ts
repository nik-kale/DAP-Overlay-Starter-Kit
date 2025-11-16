/**
 * Security utilities for sanitizing HTML and preventing XSS
 */

// Import DOMPurify - will be bundled but only used in browser
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content using DOMPurify
 * Removes script tags, event handlers, and other potentially dangerous content
 *
 * @throws {Error} If called in a non-browser environment (SSR)
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    throw new Error(
      'sanitizeHtml can only be used in browser environments. ' +
        'For SSR, sanitize HTML on the server or disable HTML content in overlays.'
    );
  }

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
      'img', // Added for image support
      'blockquote',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'title', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Check if sanitizeHtml can be safely called (i.e., we're in a browser environment)
 */
export function canSanitizeHtml(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Validate that a CSS selector is safe and valid
 * Prevents injection of dangerous selectors and validates syntax
 *
 * @param selector - The CSS selector to validate
 * @param testInDom - Whether to test the selector against the DOM (default: false)
 * @returns {boolean} True if selector is safe and valid
 */
export function validateSelector(selector: string, testInDom = false): boolean {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  // Disallow script-related selectors
  const dangerous = ['script', 'javascript:', 'data:', 'vbscript:', 'onclick', 'onerror', 'onload'];
  const lower = selector.toLowerCase();

  for (const term of dangerous) {
    if (lower.includes(term)) {
      return false;
    }
  }

  // Validate selector syntax by attempting to parse it
  if (testInDom && typeof document !== 'undefined') {
    try {
      document.querySelector(selector);
      return true;
    } catch (error) {
      console.warn(`Invalid CSS selector: "${selector}"`, error);
      return false;
    }
  }

  // Basic syntax validation for non-DOM environments
  // Check for obviously malformed selectors
  const invalidPatterns = [
    /^\s*$/,           // Empty or whitespace only
    /[<>]/,            // HTML-like characters
    /\(\s*\)/,         // Empty parentheses
    /\[\s*\]/,         // Empty brackets
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(selector)) {
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

/**
 * Validate a regex pattern for potential ReDoS (Regular Expression Denial of Service) vulnerabilities
 * Checks for patterns that could cause catastrophic backtracking
 *
 * @param pattern - The regex pattern to validate
 * @returns {boolean} True if the pattern appears safe
 */
export function validateRegexPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  // Check for excessively long patterns
  if (pattern.length > 500) {
    console.warn('Regex pattern exceeds maximum length (500 characters)');
    return false;
  }

  // Check for dangerous patterns that can cause catastrophic backtracking
  const dangerousPatterns = [
    /(\(.*\+.*\))\+/,           // Nested quantifiers: (a+)+
    /(\(.*\*.*\))\*/,           // Nested quantifiers: (a*)*
    /(\(.*\+.*\))\*/,           // Nested quantifiers: (a+)*
    /(\(.*\{.*\}.*\))\+/,       // Nested quantifiers: (a{2,})+
    /(\(.*\{.*\}.*\))\*/,       // Nested quantifiers: (a{2,})*
    /(\(.*\|.*\))\+.*\|/,       // Alternation with quantifiers
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      console.warn(`Regex pattern contains potentially dangerous construct: ${pattern}`);
      return false;
    }
  }

  return true;
}

/**
 * Safely test a regex pattern against a string
 *
 * @param pattern - The regex pattern
 * @param testString - The string to test against
 * @returns {boolean | null} True if matches, false if doesn't match, null if invalid pattern
 */
export function safeRegexTest(
  pattern: string,
  testString: string
): boolean | null {
  // Validate pattern first
  if (!validateRegexPattern(pattern)) {
    return null;
  }

  try {
    const regex = new RegExp(pattern);
    return regex.test(testString);
  } catch (error) {
    console.error('Invalid regex pattern:', pattern, error);
    return null;
  }
}
