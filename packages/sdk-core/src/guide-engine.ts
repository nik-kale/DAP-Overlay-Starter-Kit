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
import { validateStepsDocument } from './validator.js';
import { evaluateConditions } from './evaluator.js';
import { TelemetryClient } from './telemetry.js';

export interface GuideEngineOptions {
  steps: StepsDocument | Step[];
  telemetryClient?: TelemetryClient;
  callbacks?: CallbackMap;
}

export class GuideEngine {
  private steps: Step[] = [];
  private telemetryClient: TelemetryClient;
  private callbacks: CallbackMap;
  private activeSteps: Set<string> = new Set();

  constructor(options: GuideEngineOptions) {
    this.telemetryClient = options.telemetryClient || new TelemetryClient();
    this.callbacks = options.callbacks || new Map();

    // Validate and load steps
    this.loadSteps(options.steps);
  }

  /**
   * Load and validate step definitions
   */
  private loadSteps(stepsInput: StepsDocument | Step[]): void {
    let stepsDoc: StepsDocument;

    if (Array.isArray(stepsInput)) {
      stepsDoc = { version: '1.0', steps: stepsInput };
    } else {
      stepsDoc = stepsInput;
    }

    const result = validateStepsDocument(stepsDoc);

    if (!result.valid) {
      console.error('Step validation failed:', result.errors);
      throw new Error(`Invalid steps document: ${result.errors?.join(', ')}`);
    }

    this.steps = result.data!.steps;
  }

  /**
   * Resolve which steps should be active given the current context
   */
  async resolveActiveSteps(
    telemetryContext: TelemetryContext,
    routeContext: RouteContext,
    customContext: Record<string, unknown> = {}
  ): Promise<Step[]> {
    const context: EvaluationContext = {
      telemetry: telemetryContext,
      route: routeContext,
      ...customContext,
    };

    const activeSteps = this.steps.filter((step) => {
      return evaluateConditions(step.when, context);
    });

    return activeSteps;
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
}
