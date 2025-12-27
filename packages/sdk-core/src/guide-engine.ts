/**
 * Guide Engine - orchestrates step resolution and lifecycle management
 */

import type {
  Step,
  StepsDocument,
  EvaluationContext,
  CallbackMap,
  TelemetryContext,
  RouteContext,
} from './types.js';
import { evaluateConditions } from './evaluator.js';
import { TelemetryClient } from './telemetry.js';
import { AnalyticsEngine } from './analytics.js';
import { getPerfMonitor, type PerfMonitorOptions } from './performance.js';

export interface GuideEngineOptions {
  steps: StepsDocument | Step[];
  telemetryClient?: TelemetryClient;
  analyticsEngine?: AnalyticsEngine;
  callbacks?: CallbackMap;
  performance?: PerfMonitorOptions;
}

export class GuideEngine {
  private steps: Step[] = [];
  private telemetryClient: TelemetryClient;
  private analyticsEngine?: AnalyticsEngine;
  private callbacks: CallbackMap;
  private activeSteps: Set<string> = new Set();

  constructor(options: GuideEngineOptions) {
    this.telemetryClient = options.telemetryClient || new TelemetryClient();
    this.analyticsEngine = options.analyticsEngine;
    this.callbacks = options.callbacks || new Map();

    // Initialize performance monitoring
    if (options.performance) {
      getPerfMonitor(options.performance);
    }

    // Load steps (validation removed to reduce bundle size by ~100KB)
    // Validate your steps.json at build time or using a separate tool
    this.loadSteps(options.steps);
  }

  /**
   * Load step definitions
   * Note: Runtime validation has been removed to reduce bundle size
   * Validate your steps JSON schema at build time instead
   */
  private loadSteps(stepsInput: StepsDocument | Step[]): void {
    let stepsDoc: StepsDocument;

    if (Array.isArray(stepsInput)) {
      stepsDoc = { version: '1.0', steps: stepsInput };
    } else {
      stepsDoc = stepsInput;
    }

    this.steps = stepsDoc.steps;
  }

  /**
   * Resolve which steps should be active given the current context
   */
  async resolveActiveSteps(
    telemetryContext: TelemetryContext,
    routeContext: RouteContext,
    customContext: Record<string, unknown> = {}
  ): Promise<Step[]> {
    const perfMonitor = getPerfMonitor();

    return await perfMonitor.measure('step_resolution', async () => {
      const context: EvaluationContext = {
        telemetry: telemetryContext,
        route: routeContext,
        ...customContext,
      };

      const activeSteps = this.steps.filter((step) => {
        return evaluateConditions(step.when, context);
      });

      // Track performance event in analytics if available
      if (this.analyticsEngine) {
        const measurement = perfMonitor.getMeasurementsByLabel('step_resolution').slice(-1)[0];
        if (measurement) {
          this.analyticsEngine.track('sdk_performance', undefined, {
            operation: 'step_resolution',
            duration: measurement.duration,
            stepCount: this.steps.length,
            activeStepCount: activeSteps.length,
          });
        }
      }

      return activeSteps;
    }, {
      totalSteps: this.steps.length,
      errorId: telemetryContext.errorId,
      path: routeContext.path,
    });
  }

  /**
   * Get all loaded steps
   */
  getSteps(): Step[] {
    return [...this.steps];
  }

  /**
   * Register a callback handler
   */
  registerCallback(callbackId: string, fn: (context?: unknown) => void | Promise<void>): void {
    this.callbacks.set(callbackId, fn);
  }

  /**
   * Invoke a callback by ID
   */
  async invokeCallback(callbackId: string, context?: unknown): Promise<void> {
    const callback = this.callbacks.get(callbackId);
    if (callback) {
      try {
        await callback(context);
      } catch (error) {
        console.error(`Error invoking callback ${callbackId}:`, error);
      }
    } else {
      console.warn(`Callback not found: ${callbackId}`);
    }
  }

  /**
   * Handle step show lifecycle event
   */
  async onStepShow(step: Step): Promise<void> {
    this.activeSteps.add(step.id);

    // Track analytics event
    if (this.analyticsEngine) {
      this.analyticsEngine.trackStepViewed(step.id, {
        stepType: step.type,
        selector: step.selector,
      });
    }

    // Invoke onShow callback if defined
    if (step.actions?.onShow) {
      await this.invokeCallback(step.actions.onShow, { stepId: step.id });
    }

    // Emit telemetry event if defined
    if (step.telemetry?.onShowEvent) {
      await this.telemetryClient.emit(step.telemetry.onShowEvent, {
        stepId: step.id,
        stepType: step.type,
      });
    }
  }

  /**
   * Handle step dismiss lifecycle event
   */
  async onStepDismiss(step: Step): Promise<void> {
    this.activeSteps.delete(step.id);

    // Track analytics event
    if (this.analyticsEngine) {
      this.analyticsEngine.trackStepDismissed(step.id, {
        stepType: step.type,
      });
    }

    // Invoke onDismiss callback if defined
    if (step.actions?.onDismiss) {
      await this.invokeCallback(step.actions.onDismiss, { stepId: step.id });
    }

    // Emit telemetry event if defined
    if (step.telemetry?.onDismissEvent) {
      await this.telemetryClient.emit(step.telemetry.onDismissEvent, {
        stepId: step.id,
        stepType: step.type,
      });
    }
  }

  /**
   * Handle CTA click event
   */
  async onCtaClick(step: Step): Promise<void> {
    // Track analytics event
    if (this.analyticsEngine) {
      this.analyticsEngine.trackCtaClicked(step.id, step.actions?.cta?.label || 'CTA', {
        stepType: step.type,
      });
    }

    // Emit telemetry event if defined
    if (step.telemetry?.onCtaClickEvent) {
      await this.telemetryClient.emit(step.telemetry.onCtaClickEvent, {
        stepId: step.id,
        stepType: step.type,
      });
    }

    // Invoke CTA callback if defined
    if (step.actions?.cta?.callbackId) {
      await this.invokeCallback(step.actions.cta.callbackId, { stepId: step.id });
    }

    // Auto-dismiss if configured
    if (step.actions?.cta?.dismissOnClick !== false) {
      await this.onStepDismiss(step);
    }
  }

  /**
   * Get currently active step IDs
   */
  getActiveStepIds(): string[] {
    return Array.from(this.activeSteps);
  }

  /**
   * Get the telemetry client
   */
  getTelemetryClient(): TelemetryClient {
    return this.telemetryClient;
  }

  /**
   * Get the analytics engine
   */
  getAnalyticsEngine(): AnalyticsEngine | undefined {
    return this.analyticsEngine;
  }
}
