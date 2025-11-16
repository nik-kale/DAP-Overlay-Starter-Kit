/**
 * DAP Overlay SDK - Vanilla JS
 * UMD/ESM bundle for use without a build step
 */

import {
  GuideEngine,
  TelemetryClient,
  type Step,
  type StepsDocument,
  type TelemetryContext,
  type RouteContext,
  type CallbackMap,
} from '@dap-overlay/sdk-core';
import { OverlayRenderer } from './renderer.js';

export interface CreateOverlayOptions {
  steps: StepsDocument | Step[];
  telemetryClient?: TelemetryClient;
  callbacks?: CallbackMap;
  autoRender?: boolean;
}

export class DAPOverlay {
  private engine: GuideEngine;
  private renderer: OverlayRenderer;
  private currentContext: {
    telemetry: TelemetryContext;
    route: RouteContext;
  } = {
    telemetry: {},
    route: { path: window.location.pathname },
  };

  constructor(options: CreateOverlayOptions) {
    this.engine = new GuideEngine({
      steps: options.steps,
      telemetryClient: options.telemetryClient,
      callbacks: options.callbacks,
    });

    this.renderer = new OverlayRenderer({
      onDismiss: (stepId) => this.handleDismiss(stepId),
      onCtaClick: (stepId) => this.handleCtaClick(stepId),
    });

    if (options.autoRender !== false) {
      this.render();
    }
  }

  /**
   * Update context and re-render
   */
  async updateContext(telemetry?: TelemetryContext, route?: RouteContext): Promise<void> {
    if (telemetry) {
      this.currentContext.telemetry = { ...this.currentContext.telemetry, ...telemetry };
    }
    if (route) {
      this.currentContext.route = { ...this.currentContext.route, ...route };
    }
    await this.render();
  }

  /**
   * Render active overlays based on current context
   */
  async render(): Promise<void> {
    const activeSteps = await this.engine.resolveActiveSteps(
      this.currentContext.telemetry,
      this.currentContext.route
    );

    // Remove overlays that are no longer active
    const currentStepIds = new Set(activeSteps.map((s) => s.id));
    const activeStepIds = this.engine.getActiveStepIds();

    for (const stepId of activeStepIds) {
      if (!currentStepIds.has(stepId)) {
        this.renderer.destroy(stepId);
      }
    }

    // Render new overlays
    for (const step of activeSteps) {
      if (!activeStepIds.includes(step.id)) {
        this.renderer.render(step);
        await this.engine.onStepShow(step);
      }
    }
  }

  /**
   * Handle dismiss event
   */
  private async handleDismiss(stepId: string): Promise<void> {
    const step = this.engine.getSteps().find((s) => s.id === stepId);
    if (step) {
      this.renderer.destroy(stepId);
      await this.engine.onStepDismiss(step);
    }
  }

  /**
   * Handle CTA click event
   */
  private async handleCtaClick(stepId: string): Promise<void> {
    const step = this.engine.getSteps().find((s) => s.id === stepId);
    if (step) {
      await this.engine.onCtaClick(step);

      // Auto-dismiss if configured
      if (step.actions?.cta?.dismissOnClick !== false) {
        this.renderer.destroy(stepId);
      }
    }
  }

  /**
   * Register a callback handler
   */
  registerCallback(callbackId: string, fn: (context?: unknown) => void | Promise<void>): void {
    this.engine.registerCallback(callbackId, fn);
  }

  /**
   * Destroy all overlays and cleanup
   */
  destroy(): void {
    this.renderer.destroyAll();
  }

  /**
   * Get the underlying guide engine
   */
  getEngine(): GuideEngine {
    return this.engine;
  }

  /**
   * Get the telemetry client
   */
  getTelemetryClient(): TelemetryClient {
    return this.engine.getTelemetryClient();
  }
}

/**
 * Factory function for creating overlay instances
 */
export function createOverlay(options: CreateOverlayOptions): DAPOverlay {
  return new DAPOverlay(options);
}

// Re-export types and utilities from core
export * from '@dap-overlay/sdk-core';
export { OverlayRenderer } from './renderer.js';
