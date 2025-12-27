/**
 * Performance monitoring and metrics collection
 */

// ==================== Types ====================

export interface PerfMeasurement {
  label: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface PerfReport {
  measurements: PerfMeasurement[];
  summary: {
    totalMeasurements: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
  };
  byLabel: Map<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
  }>;
}

export interface PerfBudget {
  maxStepResolutionMs: number;
  maxRenderMs: number;
  maxApiLatencyMs: number;
  maxSanitizationMs: number;
  warnOnExceed: boolean;
}

export interface PerfMonitorOptions {
  enabled?: boolean;
  budget?: Partial<PerfBudget>;
  trackMemory?: boolean;
  sampleRate?: number; // 0-1, percentage of operations to measure
}

// ==================== Performance Monitor ====================

export class PerfMonitor {
  private enabled: boolean;
  private budget: PerfBudget;
  private trackMemory: boolean;
  private sampleRate: number;
  private measurements: PerfMeasurement[] = [];
  private activeMeasurements: Map<string, { startTime: number; metadata?: Record<string, unknown> }> = new Map();
  private maxMeasurements: number = 1000; // Limit stored measurements to prevent memory leaks

  constructor(options: PerfMonitorOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.trackMemory = options.trackMemory ?? false;
    this.sampleRate = options.sampleRate ?? 1.0;
    this.budget = {
      maxStepResolutionMs: options.budget?.maxStepResolutionMs ?? 50,
      maxRenderMs: options.budget?.maxRenderMs ?? 100,
      maxApiLatencyMs: options.budget?.maxApiLatencyMs ?? 1000,
      maxSanitizationMs: options.budget?.maxSanitizationMs ?? 20,
      warnOnExceed: options.budget?.warnOnExceed ?? true,
    };
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Update performance budget
   */
  updateBudget(budget: Partial<PerfBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  /**
   * Check if should sample this measurement based on sample rate
   */
  private shouldSample(): boolean {
    return Math.random() < this.sampleRate;
  }

  /**
   * Start a performance measurement
   */
  start(label: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled || !this.shouldSample()) return;

    const startTime = performance.now();
    this.activeMeasurements.set(label, { startTime, metadata });
  }

  /**
   * End a performance measurement and record it
   */
  end(label: string, additionalMetadata?: Record<string, unknown>): PerfMeasurement | null {
    if (!this.enabled) return null;

    const active = this.activeMeasurements.get(label);
    if (!active) {
      console.warn(`[DAP Performance] No active measurement found for label: ${label}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - active.startTime;

    const measurement: PerfMeasurement = {
      label,
      startTime: active.startTime,
      endTime,
      duration,
      metadata: {
        ...active.metadata,
        ...additionalMetadata,
        ...(this.trackMemory ? this.getMemoryInfo() : {}),
      },
    };

    // Check budget
    this.checkBudget(label, duration);

    // Store measurement (with limit to prevent memory leaks)
    this.measurements.push(measurement);
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift(); // Remove oldest measurement
    }

    // Clean up active measurement
    this.activeMeasurements.delete(label);

    return measurement;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled || !this.shouldSample()) {
      return await fn();
    }

    this.start(label, metadata);
    try {
      const result = await fn();
      this.end(label, { success: true });
      return result;
    } catch (error) {
      this.end(label, { success: false, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(
    label: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    if (!this.enabled || !this.shouldSample()) {
      return fn();
    }

    this.start(label, metadata);
    try {
      const result = fn();
      this.end(label, { success: true });
      return result;
    } catch (error) {
      this.end(label, { success: false, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Check if measurement exceeds budget
   */
  private checkBudget(label: string, duration: number): void {
    if (!this.budget.warnOnExceed) return;

    const budgetKey = this.getLabelBudgetKey(label);
    if (!budgetKey) return;

    const maxDuration = this.budget[budgetKey];
    if (duration > maxDuration) {
      console.warn(
        `[DAP Performance] Budget exceeded for "${label}": ${duration.toFixed(2)}ms (max: ${maxDuration}ms)`
      );
    }
  }

  /**
   * Map label to budget key
   */
  private getLabelBudgetKey(label: string): keyof PerfBudget | null {
    if (label.includes('step_resolution') || label.includes('resolve')) {
      return 'maxStepResolutionMs';
    }
    if (label.includes('render')) {
      return 'maxRenderMs';
    }
    if (label.includes('api') || label.includes('fetch') || label.includes('telemetry')) {
      return 'maxApiLatencyMs';
    }
    if (label.includes('sanitize')) {
      return 'maxSanitizationMs';
    }
    return null;
  }

  /**
   * Get memory info (if available)
   */
  private getMemoryInfo(): Record<string, unknown> {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return {};
    }

    const memory = (performance as any).memory;
    return {
      heapUsed: memory.usedJSHeapSize,
      heapTotal: memory.totalJSHeapSize,
      heapLimit: memory.jsHeapSizeLimit,
    };
  }

  /**
   * Get all measurements
   */
  getMeasurements(): PerfMeasurement[] {
    return [...this.measurements];
  }

  /**
   * Get measurements by label
   */
  getMeasurementsByLabel(label: string): PerfMeasurement[] {
    return this.measurements.filter(m => m.label === label);
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Generate performance report
   */
  getReport(): PerfReport {
    if (this.measurements.length === 0) {
      return {
        measurements: [],
        summary: {
          totalMeasurements: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          p50Duration: 0,
          p95Duration: 0,
          p99Duration: 0,
        },
        byLabel: new Map(),
      };
    }

    // Calculate overall summary
    const durations = this.measurements.map(m => m.duration).sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    const summary = {
      totalMeasurements: this.measurements.length,
      averageDuration: totalDuration / this.measurements.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50Duration: this.calculatePercentile(durations, 50),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
    };

    // Calculate by-label statistics
    const byLabel = new Map<string, {
      count: number;
      totalDuration: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
    }>();

    const labelGroups = new Map<string, PerfMeasurement[]>();
    for (const measurement of this.measurements) {
      if (!labelGroups.has(measurement.label)) {
        labelGroups.set(measurement.label, []);
      }
      labelGroups.get(measurement.label)!.push(measurement);
    }

    for (const [label, measurements] of labelGroups) {
      const labelDurations = measurements.map(m => m.duration);
      const labelTotal = labelDurations.reduce((sum, d) => sum + d, 0);

      byLabel.set(label, {
        count: measurements.length,
        totalDuration: labelTotal,
        averageDuration: labelTotal / measurements.length,
        minDuration: Math.min(...labelDurations),
        maxDuration: Math.max(...labelDurations),
      });
    }

    return {
      measurements: this.getMeasurements(),
      summary,
      byLabel,
    };
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = [];
    this.activeMeasurements.clear();
  }

  /**
   * Get a formatted summary string
   */
  getSummaryString(): string {
    const report = this.getReport();
    const lines = [
      '=== Performance Summary ===',
      `Total Measurements: ${report.summary.totalMeasurements}`,
      `Average Duration: ${report.summary.averageDuration.toFixed(2)}ms`,
      `Min/Max Duration: ${report.summary.minDuration.toFixed(2)}ms / ${report.summary.maxDuration.toFixed(2)}ms`,
      `P50/P95/P99: ${report.summary.p50Duration.toFixed(2)}ms / ${report.summary.p95Duration.toFixed(2)}ms / ${report.summary.p99Duration.toFixed(2)}ms`,
      '',
      '=== By Label ===',
    ];

    for (const [label, stats] of report.byLabel) {
      lines.push(
        `${label}: ${stats.count} calls, avg ${stats.averageDuration.toFixed(2)}ms, min/max ${stats.minDuration.toFixed(2)}ms/${stats.maxDuration.toFixed(2)}ms`
      );
    }

    return lines.join('\n');
  }
}

// ==================== Global Instance ====================

let globalPerfMonitor: PerfMonitor | null = null;

/**
 * Get or create the global performance monitor instance
 */
export function getPerfMonitor(options?: PerfMonitorOptions): PerfMonitor {
  if (!globalPerfMonitor) {
    globalPerfMonitor = new PerfMonitor(options);
  } else if (options) {
    globalPerfMonitor.setEnabled(options.enabled ?? true);
    if (options.budget) {
      globalPerfMonitor.updateBudget(options.budget);
    }
  }
  return globalPerfMonitor;
}

/**
 * Set the global performance monitor instance
 */
export function setPerfMonitor(monitor: PerfMonitor): void {
  globalPerfMonitor = monitor;
}

