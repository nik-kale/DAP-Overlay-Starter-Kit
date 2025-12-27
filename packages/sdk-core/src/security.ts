/**
 * Security utilities for sanitizing HTML and preventing XSS
 */

// Lazy-loaded DOMPurify instance (only loaded when needed)
let DOMPurifyInstance: typeof import('dompurify').default | null = null;

/**
 * Lazy-load DOMPurify (only when HTML sanitization is needed)
 */
async function loadDOMPurify(): Promise<typeof import('dompurify').default> {
  if (!DOMPurifyInstance) {
    const module = await import('dompurify');
    DOMPurifyInstance = module.default;
  }
  return DOMPurifyInstance;
}

/**
 * Sanitize HTML content using DOMPurify
 * Removes script tags, event handlers, and other potentially dangerous content
 *
 * NOTE: This function is async and lazy-loads DOMPurify on first use
 *
 * @throws {Error} If called in a non-browser environment (SSR)
 */
export async function sanitizeHtml(html: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error(
      'sanitizeHtml can only be used in browser environments. ' +
        'For SSR, sanitize HTML on the server or disable HTML content in overlays.'
    );
  }

  const DOMPurify = await loadDOMPurify();

  // Add hook to validate URLs in href and src attributes
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Validate href attributes (links)
    if (node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      if (href && !validateUrl(href)) {
        console.warn(`[DAP Overlay] Blocked potentially dangerous URL in href: ${href}`);
        node.removeAttribute('href');
      }
    }

    // Validate src attributes (images)
    if (node.hasAttribute('src')) {
      const src = node.getAttribute('src');
      if (src && !validateUrl(src)) {
        console.warn(`[DAP Overlay] Blocked potentially dangerous URL in src: ${src}`);
        node.removeAttribute('src');
      }
    }

    // Ensure external links have secure rel attributes
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        // Add noopener and noreferrer for security
        const rel = node.getAttribute('rel');
        const relValues = new Set(rel ? rel.split(/\s+/) : []);
        relValues.add('noopener');
        relValues.add('noreferrer');
        node.setAttribute('rel', Array.from(relValues).join(' '));
      }
    }
  });

  const sanitized = DOMPurify.sanitize(html, {
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

  // Remove hooks to prevent memory leaks
  DOMPurify.removeAllHooks();

  return sanitized;
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
 * Allowed URL protocols for href and src attributes
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Validate that a URL uses an allowed protocol
 * Prevents javascript:, data:, vbscript:, and other XSS vectors
 *
 * @param url - The URL to validate
 * @returns {boolean} True if the URL uses an allowed protocol
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmed = url.trim();

  // Allow relative URLs (start with / or # or ?)
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return true;
  }

  try {
    // Parse the URL (will throw for invalid URLs)
    // Use a base URL for relative URLs to prevent errors
    const parsed = new URL(trimmed, 'http://example.com');
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    // If URL parsing fails, reject it
    return false;
  }
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
