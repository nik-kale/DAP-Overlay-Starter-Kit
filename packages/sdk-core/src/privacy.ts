/**
 * Privacy utilities for PII scrubbing and GDPR/CCPA compliance
 */

// ==================== Types ====================

export interface PrivacyConfig {
  /**
   * Scrub query parameters from URLs
   */
  scrubUrls: boolean;
  /**
   * Detect and scrub PII patterns (emails, phone numbers, credit cards)
   */
  scrubPii: boolean;
  /**
   * Exclude stack traces from error events
   */
  excludeStackTraces: boolean;
  /**
   * Hash user IDs before storage/transmission
   */
  hashUserIds: boolean;
  /**
   * Additional sensitive query parameters to scrub
   */
  sensitiveParams: string[];
}

// ==================== Constants ====================

/**
 * Default sensitive query parameters to scrub from URLs
 */
const DEFAULT_SENSITIVE_PARAMS = [
  'token',
  'key',
  'secret',
  'password',
  'pwd',
  'pass',
  'email',
  'auth',
  'authorization',
  'bearer',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'session',
  'ssn',
  'credit_card',
  'cvv',
];

/**
 * PII detection patterns
 */
const PII_PATTERNS = [
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  },
  {
    name: 'phone',
    pattern: /\b(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
  },
  {
    name: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    name: 'credit_card',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  },
  {
    name: 'ip_address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
];

// ==================== URL Scrubbing ====================

/**
 * Scrub sensitive query parameters from a URL
 */
export function scrubUrl(url: string, sensitiveParams: string[] = DEFAULT_SENSITIVE_PARAMS): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    const allSensitiveParams = [...DEFAULT_SENSITIVE_PARAMS, ...sensitiveParams];

    // Remove sensitive query parameters
    for (const param of allSensitiveParams) {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.set(param, '[REDACTED]');
      }
    }

    return parsed.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

// ==================== PII Detection & Scrubbing ====================

/**
 * Detect and scrub PII patterns from text
 */
export function scrubPii(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let scrubbedText = text;

  for (const { pattern, name } of PII_PATTERNS) {
    scrubbedText = scrubbedText.replace(pattern, `[${name.toUpperCase()}_REDACTED]`);
  }

  return scrubbedText;
}

/**
 * Recursively scrub PII from an object
 */
export function scrubPiiFromObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return scrubPii(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => scrubPiiFromObject(item));
  }

  if (typeof obj === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      scrubbed[key] = scrubPiiFromObject(value);
    }
    return scrubbed;
  }

  return obj;
}

// ==================== User ID Hashing ====================

/**
 * Hash a user ID using SHA-256 (requires Web Crypto API)
 */
export async function hashUserId(userId: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    console.warn('[DAP Privacy] Web Crypto API not available, returning unhashed user ID');
    return userId;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('[DAP Privacy] Failed to hash user ID:', error);
    return userId;
  }
}

/**
 * Simple synchronous hash using basic string operations (fallback)
 */
export function simpleHashUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ==================== Privacy Engine ====================

export class PrivacyEngine {
  private config: PrivacyConfig;

  constructor(config: Partial<PrivacyConfig> = {}) {
    this.config = {
      scrubUrls: config.scrubUrls ?? true,
      scrubPii: config.scrubPii ?? true,
      excludeStackTraces: config.excludeStackTraces ?? true,
      hashUserIds: config.hashUserIds ?? false,
      sensitiveParams: config.sensitiveParams || [],
    };
  }

  /**
   * Update privacy configuration
   */
  configure(config: Partial<PrivacyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current privacy configuration
   */
  getConfig(): PrivacyConfig {
    return { ...this.config };
  }

  /**
   * Scrub an analytics event payload
   */
  scrubEvent(event: Record<string, unknown>): Record<string, unknown> {
    const scrubbed = { ...event };

    // Scrub URLs in metadata
    if (this.config.scrubUrls && scrubbed.metadata && typeof scrubbed.metadata === 'object') {
      const metadata = scrubbed.metadata as Record<string, unknown>;
      if (metadata.url && typeof metadata.url === 'string') {
        metadata.url = scrubUrl(metadata.url, this.config.sensitiveParams);
      }
      if (metadata.referrer && typeof metadata.referrer === 'string') {
        metadata.referrer = scrubUrl(metadata.referrer, this.config.sensitiveParams);
      }
    }

    // Scrub URLs in payload
    if (this.config.scrubUrls && scrubbed.payload && typeof scrubbed.payload === 'object') {
      const payload = scrubbed.payload as Record<string, unknown>;
      if (payload.url && typeof payload.url === 'string') {
        payload.url = scrubUrl(payload.url as string, this.config.sensitiveParams);
      }
    }

    // Scrub PII from entire event
    if (this.config.scrubPii) {
      return scrubPiiFromObject(scrubbed) as Record<string, unknown>;
    }

    return scrubbed;
  }

  /**
   * Scrub stack traces from error events
   */
  scrubStackTrace(error: { stack?: string; [key: string]: unknown }): { stack?: string; [key: string]: unknown } {
    if (this.config.excludeStackTraces && error.stack) {
      return { ...error, stack: '[REDACTED_FOR_PRIVACY]' };
    }
    return error;
  }

  /**
   * Hash a user ID if configured
   */
  async processUserId(userId: string): Promise<string> {
    if (this.config.hashUserIds) {
      return await hashUserId(userId);
    }
    return userId;
  }

  /**
   * Synchronously hash a user ID if configured
   */
  processUserIdSync(userId: string): string {
    if (this.config.hashUserIds) {
      return simpleHashUserId(userId);
    }
    return userId;
  }
}

// ==================== Global Instance ====================

let globalPrivacyEngine: PrivacyEngine | null = null;

/**
 * Get or create the global privacy engine instance
 */
export function getPrivacyEngine(config?: Partial<PrivacyConfig>): PrivacyEngine {
  if (!globalPrivacyEngine) {
    globalPrivacyEngine = new PrivacyEngine(config);
  } else if (config) {
    globalPrivacyEngine.configure(config);
  }
  return globalPrivacyEngine;
}

