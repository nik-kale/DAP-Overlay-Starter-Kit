/**
 * Telemetry client for fetching telemetry data and emitting events
 * Supports both mock (local) and real (API) modes
 */

import type { TelemetryContext, TelemetryEvent } from './types.js';

export interface TelemetryClientOptions {
  baseUrl?: string;
  useMock?: boolean;
  mockData?: TelemetryContext;
}

export class TelemetryClient {
  private baseUrl: string;
  private useMock: boolean;
  private mockData: TelemetryContext;

  constructor(options: TelemetryClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.useMock = options.useMock ?? true;
    this.mockData = options.mockData || {};
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

    try {
      const response = await fetch(`${this.baseUrl}/api/telemetry/emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Telemetry emit failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to emit telemetry:', error);
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
