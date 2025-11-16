/**
 * Debug logging utility for DAP Overlay SDK
 */

import type { DebugOptions } from './types.js';

export class DebugLogger {
  private options: DebugOptions;
  private prefix = '[DAP Overlay]';

  constructor(options: DebugOptions = { enabled: false }) {
    this.options = options;
  }

  /**
   * Update debug options
   */
  setOptions(options: Partial<DebugOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Log condition evaluation
   */
  logCondition(stepId: string, conditionType: string, result: boolean, details?: unknown): void {
    if (!this.options.enabled || !this.options.logConditionEvaluation) {
      return;
    }

    const emoji = result ? '✓' : '✗';
    console.log(
      `${this.prefix} ${emoji} Condition [${conditionType}] for step "${stepId}":`,
      result,
      details || ''
    );
  }

  /**
   * Log step resolution
   */
  logStepResolution(
    stepId: string,
    action: 'resolved' | 'filtered' | 'error',
    reason?: string
  ): void {
    if (!this.options.enabled || !this.options.logStepResolution) {
      return;
    }

    const emoji = action === 'resolved' ? '✓' : action === 'error' ? '✗' : '⊘';
    const message = reason ? `: ${reason}` : '';
    console.log(`${this.prefix} ${emoji} Step "${stepId}" ${action}${message}`);
  }

  /**
   * Log telemetry events
   */
  logTelemetry(event: string, stepId?: string, data?: unknown): void {
    if (!this.options.enabled || !this.options.logTelemetry) {
      return;
    }

    const stepInfo = stepId ? ` (step: "${stepId}")` : '';
    console.log(`${this.prefix} 📊 Telemetry [${event}]${stepInfo}`, data || '');
  }

  /**
   * Log callback execution
   */
  logCallback(callbackId: string, stepId?: string, error?: Error): void {
    if (!this.options.enabled || !this.options.logCallbacks) {
      return;
    }

    const stepInfo = stepId ? ` (step: "${stepId}")` : '';
    if (error) {
      console.error(`${this.prefix} ✗ Callback "${callbackId}"${stepInfo} failed:`, error);
    } else {
      console.log(`${this.prefix} ✓ Callback "${callbackId}"${stepInfo} executed`);
    }
  }

  /**
   * Log general info
   */
  info(message: string, data?: unknown): void {
    if (!this.options.enabled) {
      return;
    }

    console.log(`${this.prefix} ℹ ${message}`, data || '');
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: unknown): void {
    if (!this.options.enabled) {
      return;
    }

    console.warn(`${this.prefix} ⚠ ${message}`, data || '');
  }

  /**
   * Log errors (always logged even if debug is disabled)
   */
  error(message: string, error?: Error | unknown): void {
    console.error(`${this.prefix} ✗ ${message}`, error || '');
  }
}

// Singleton instance for convenience
let globalDebugLogger: DebugLogger | null = null;

/**
 * Get the global debug logger instance
 */
export function getDebugLogger(options?: DebugOptions): DebugLogger {
  if (!globalDebugLogger) {
    globalDebugLogger = new DebugLogger(options);
  } else if (options) {
    globalDebugLogger.setOptions(options);
  }
  return globalDebugLogger;
}
