/**
 * React hook for integrating with the Guide Engine
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  GuideEngine,
  TelemetryClient,
  type Step,
  type StepsDocument,
  type TelemetryContext,
  type RouteContext,
  type CallbackMap,
} from '@dap-overlay/sdk-core';

export interface UseGuideEngineOptions {
  steps: StepsDocument | Step[];
  telemetryClient?: TelemetryClient;
  callbacks?: CallbackMap;
  telemetryContext?: TelemetryContext;
  routeContext?: RouteContext;
}

export function useGuideEngine(options: UseGuideEngineOptions) {
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const engineRef = useRef<GuideEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    try {
      const engine = new GuideEngine({
        steps: options.steps,
        telemetryClient: options.telemetryClient,
        callbacks: options.callbacks,
      });
      engineRef.current = engine;
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize GuideEngine:', error);
      setIsLoading(false);
    }
  }, [options.steps, options.telemetryClient, options.callbacks]);

  // Resolve active steps when context changes
  useEffect(() => {
    if (!engineRef.current) return;

    const resolveSteps = async () => {
      const telemetry = options.telemetryContext || {};
      const route = options.routeContext || { path: window.location.pathname };

      const steps = await engineRef.current!.resolveActiveSteps(telemetry, route);
      setActiveSteps(steps);
    };

    resolveSteps();
  }, [options.telemetryContext, options.routeContext]);

  const handleStepShow = useCallback(async (step: Step) => {
    if (engineRef.current) {
      await engineRef.current.onStepShow(step);
    }
  }, []);

  const handleStepDismiss = useCallback(async (step: Step) => {
    if (engineRef.current) {
      await engineRef.current.onStepDismiss(step);
      // Remove from active steps
      setActiveSteps((prev) => prev.filter((s) => s.id !== step.id));
    }
  }, []);

  const handleCtaClick = useCallback(async (step: Step) => {
    if (engineRef.current) {
      await engineRef.current.onCtaClick(step);
      // Auto-dismiss if configured
      if (step.actions?.cta?.dismissOnClick !== false) {
        setActiveSteps((prev) => prev.filter((s) => s.id !== step.id));
      }
    }
  }, []);

  const registerCallback = useCallback((callbackId: string, fn: (context?: unknown) => void | Promise<void>) => {
    if (engineRef.current) {
      engineRef.current.registerCallback(callbackId, fn);
    }
  }, []);

  return {
    activeSteps,
    isLoading,
    handleStepShow,
    handleStepDismiss,
    handleCtaClick,
    registerCallback,
    engine: engineRef.current,
  };
}
