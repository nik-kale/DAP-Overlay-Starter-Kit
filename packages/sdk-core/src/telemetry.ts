/**
 * Telemetry client for fetching telemetry data and emitting events
 * Supports both mock (local) and real (API) modes
 * Includes retry logic and rate limiting for reliability and security
 */

import type { TelemetryContext, TelemetryEvent } from './types.js';
import { retry, RateLimiter } from './utils.js';

export interface TelemetryClientOptions {
  baseUrl?: string;
  useMock?: boolean;
  mockData?: TelemetryContext;
  /**
   * Enable retry logic for failed telemetry requests
   * Default: true
   */
  enableRetry?: boolean;
  /**
   * Maximum retry attempts
   * Default: 3
   */
  maxRetries?: number;
  /**
   * Enable rate limiting to prevent excessive telemetry calls
   * Default: true
   */
  enableRateLimit?: boolean;
  /**
   * Maximum telemetry events per second
   * Default: 10
   */
  maxEventsPerSecond?: number;
}

export class TelemetryClient {
  private baseUrl: string;
  private useMock: boolean;
  private mockData: TelemetryContext;
  private enableRetry: boolean;
  private maxRetries: number;
  private rateLimiter: RateLimiter | null;

  constructor(options: TelemetryClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.useMock = options.useMock ?? true;
    this.mockData = options.mockData || {};
    this.enableRetry = options.enableRetry ?? true;
    this.maxRetries = options.maxRetries ?? 3;

    // Warn if using HTTP for non-localhost endpoints
    if (!this.useMock && this.baseUrl.startsWith('http://') && !this.baseUrl.includes('localhost')) {
      console.warn(
        '[DAP Overlay] TelemetryClient is using HTTP for a non-localhost endpoint. ' +
        'This is insecure and may leak sensitive data. Please use HTTPS in production.'
      );
    }

    // Initialize rate limiter if enabled
    const enableRateLimit = options.enableRateLimit ?? true;
    const maxEventsPerSecond = options.maxEventsPerSecond ?? 10;
    this.rateLimiter = enableRateLimit
      ? new RateLimiter(maxEventsPerSecond, maxEventsPerSecond)
      : null;
  }

  /**
   * Fetch telemetry data (context for condition evaluation)
   */
  async fetchTelemetry(context: Record<string, unknown> = {}): Promise<TelemetryContext> {
    if (this.useMock) {
      // Return mock data in local mode
      return {
        ...this.mockData,
        ...context,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
        credentials: 'same-origin', // Only send credentials for same-origin requests
      });

      if (!response.ok) {
        throw new Error(`Telemetry fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch telemetry:', error);
      return {};
    }
  }

  /**
   * Emit a telemetry event
   */
  async emit(eventName: string, payload: Record<string, unknown> = {}): Promise<void> {
    // Check rate limit
    if (this.rateLimiter && !this.rateLimiter.tryConsume()) {
      console.warn('[DAP Overlay] Telemetry event rate limit exceeded, event dropped:', eventName);
      return;
    }

    const event: TelemetryEvent = {
      eventName,
      payload,
      timestamp: Date.now(),
    };

    if (this.useMock) {
      // In mock mode, just log to console
      console.log('[Telemetry Event - MOCK]', event);
      return;
    }

    const sendEvent = async () => {
      const response = await fetch(`${this.baseUrl}/api/telemetry/emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        credentials: 'same-origin', // Only send credentials for same-origin requests
      });

      if (!response.ok) {
        throw new Error(`Telemetry emit failed: ${response.statusText}`);
      }
    };

    try {
      if (this.enableRetry) {
        await retry(sendEvent, {
          maxAttempts: this.maxRetries,
          baseDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(`[DAP Overlay] Retrying telemetry event (attempt ${attempt}):`, error.message);
          },
        });
      } else {
        await sendEvent();
      }
    } catch (error) {
      console.error('[DAP Overlay] Failed to emit telemetry after retries:', error);
    }
  }

  /**
   * Update mock mode configuration
   */
  setMockMode(useMock: boolean, mockData?: TelemetryContext): void {
    this.useMock = useMock;
    if (mockData) {
      this.mockData = mockData;
    }
  }

  /**
   * Update base URL for API calls
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }
}
