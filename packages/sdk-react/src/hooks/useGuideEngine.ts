/**
 * React hook for integrating with the Guide Engine
 *
 * IMPORTANT: To avoid unnecessary re-initialization, ensure that:
 * - `steps` is memoized or stable reference
 * - `telemetryClient` is created outside the component or memoized
 * - `callbacks` Map is created outside the component or memoized
 *
 * Example:
 * ```tsx
 * const telemetryClient = useMemo(() => new TelemetryClient({ useMock: true }), []);
 * const callbacks = useMemo(() => new Map([['myCallback', handleCallback]]), [handleCallback]);
 * ```
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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

  // Serialize steps for deep comparison to avoid unnecessary re-initialization
  const stepsKey = useMemo(
    () => JSON.stringify(options.steps),
    [options.steps]
  );

  // Store telemetry client and callbacks in refs to avoid recreation
  const telemetryClientRef = useRef(options.telemetryClient);
  const callbacksRef = useRef(options.callbacks);

  // Update refs when provided values change
  useEffect(() => {
    telemetryClientRef.current = options.telemetryClient;
  }, [options.telemetryClient]);

  useEffect(() => {
    callbacksRef.current = options.callbacks;
  }, [options.callbacks]);

  // Initialize engine only when steps actually change
  useEffect(() => {
    try {
      const engine = new GuideEngine({
        steps: options.steps,
        telemetryClient: telemetryClientRef.current,
        callbacks: callbacksRef.current,
      });
      engineRef.current = engine;
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize GuideEngine:', error);
      setIsLoading(false);
    }
    // Only depend on stepsKey, not the objects themselves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepsKey]);

  // Serialize context for deep comparison
  const telemetryContextKey = useMemo(
    () => JSON.stringify(options.telemetryContext || {}),
    [options.telemetryContext]
  );

  const routeContextKey = useMemo(
    () => JSON.stringify(options.routeContext || { path: window.location.pathname }),
    [options.routeContext]
  );

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
    // Use serialized keys for comparison
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetryContextKey, routeContextKey]);

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
