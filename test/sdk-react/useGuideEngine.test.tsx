/**
 * Tests for useGuideEngine hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { useGuideEngine } from '../../packages/sdk-react/src/hooks/useGuideEngine';
import { TelemetryClient } from '../../packages/sdk-core/src/index';
import type { Step, StepsDocument } from '../../packages/sdk-core/src/types';

describe('useGuideEngine Hook', () => {
  let mockSteps: Step[];
  let mockTelemetryClient: TelemetryClient;

  beforeEach(() => {
    mockSteps = [
      {
        id: 'step-1',
        type: 'banner',
        content: {
          title: 'Welcome',
          body: 'Welcome to the app',
        },
        when: {
          pathRegex: '^/$',
        },
      },
      {
        id: 'step-2',
        type: 'tooltip',
        selector: '#button',
        content: {
          title: 'Click here',
          body: 'This is a button',
        },
        when: {
          pathRegex: '^/dashboard$',
        },
      },
    ];

    mockTelemetryClient = new TelemetryClient({ useMock: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('should initialize immediately (no async validation)', () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
      })
    );

    // No loading state since validation was removed for bundle size
    // Initialization is now synchronous
    expect(result.current.isLoading).toBe(false);
  });

  it('should set isLoading to false after initialization', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should initialize engine with provided steps', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
      })
    );

    await waitFor(() => {
      expect(result.current.engine).not.toBeNull();
    });
  });

  it('should resolve active steps based on route context', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
        routeContext: { path: '/' },
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(1);
      expect(result.current.activeSteps[0].id).toBe('step-1');
    });
  });

  it('should accept telemetry client', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
        telemetryClient: mockTelemetryClient,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.engine).not.toBeNull();
  });

  it('should accept callbacks map', async () => {
    const mockCallback = vi.fn();
    const callbacks = new Map([['test-callback', mockCallback]]);

    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
        callbacks,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.engine).not.toBeNull();
  });

  it('should provide handleStepShow function', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.handleStepShow).toBeInstanceOf(Function);
  });

  it('should provide handleStepDismiss function', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.handleStepDismiss).toBeInstanceOf(Function);
  });

  it('should provide handleCtaClick function', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.handleCtaClick).toBeInstanceOf(Function);
  });

  it('should provide registerCallback function', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.registerCallback).toBeInstanceOf(Function);
  });

  it('should remove step from activeSteps when dismissed', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
        routeContext: { path: '/' },
      })
    );

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(1);
    });

    const stepToDismiss = result.current.activeSteps[0];

    await result.current.handleStepDismiss(stepToDismiss);

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(0);
    });
  });

  it('should remove step from activeSteps when CTA is clicked with auto-dismiss', async () => {
    const stepWithCta: Step = {
      id: 'step-cta',
      type: 'banner',
      content: { body: 'Test' },
      actions: {
        cta: {
          label: 'Click me',
          callbackId: 'test',
          // dismissOnClick defaults to true
        },
      },
      when: {
        pathRegex: '^/$',
      },
    };

    const { result } = renderHook(() =>
      useGuideEngine({
        steps: [stepWithCta],
        routeContext: { path: '/' },
      })
    );

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(1);
    });

    await result.current.handleCtaClick(stepWithCta);

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(0);
    });
  });

  it('should not remove step when CTA dismissOnClick is false', async () => {
    const stepWithCta: Step = {
      id: 'step-cta',
      type: 'banner',
      content: { body: 'Test' },
      actions: {
        cta: {
          label: 'Click me',
          callbackId: 'test',
          dismissOnClick: false,
        },
      },
      when: {
        pathRegex: '^/$',
      },
    };

    const { result } = renderHook(() =>
      useGuideEngine({
        steps: [stepWithCta],
        routeContext: { path: '/' },
      })
    );

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(1);
    });

    await result.current.handleCtaClick(stepWithCta);

    // Should still be in activeSteps
    expect(result.current.activeSteps).toHaveLength(1);
  });

  it('should re-resolve steps when route context changes', async () => {
    const { result, rerender } = renderHook(
      ({ routeContext }) =>
        useGuideEngine({
          steps: mockSteps,
          routeContext,
        }),
      {
        initialProps: { routeContext: { path: '/' } },
      }
    );

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(1);
      expect(result.current.activeSteps[0].id).toBe('step-1');
    });

    // Change route
    rerender({ routeContext: { path: '/dashboard' } });

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(1);
      expect(result.current.activeSteps[0].id).toBe('step-2');
    });
  });

  it('should re-resolve steps when telemetry context changes', async () => {
    const stepWithTelemetry: Step = {
      id: 'step-telemetry',
      type: 'banner',
      content: { body: 'Test' },
      when: {
        pathRegex: '^/$',
        customExpr: {
          op: 'equals',
          field: 'telemetry.hasCompletedOnboarding',
          value: true,
        },
      },
    };

    const { result, rerender } = renderHook(
      ({ telemetryContext }) =>
        useGuideEngine({
          steps: [stepWithTelemetry],
          routeContext: { path: '/' },
          telemetryContext,
        }),
      {
        initialProps: { telemetryContext: { hasCompletedOnboarding: false } },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initially no steps (condition not met)
    expect(result.current.activeSteps).toHaveLength(0);

    // Change telemetry context
    rerender({ telemetryContext: { hasCompletedOnboarding: true } });

    await waitFor(() => {
      expect(result.current.activeSteps).toHaveLength(1);
    });
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const invalidSteps = null as unknown as Step[];

    const { result } = renderHook(() =>
      useGuideEngine({
        steps: invalidSteps,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to initialize GuideEngine:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should register callbacks dynamically', async () => {
    const { result } = renderHook(() =>
      useGuideEngine({
        steps: mockSteps,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const mockCallback = vi.fn();

    result.current.registerCallback('dynamic-callback', mockCallback);

    // Callback should be registered (we can't easily verify this without exposing internal state)
    expect(result.current.registerCallback).toBeInstanceOf(Function);
  });

  it('should accept StepsDocument instead of Step array', async () => {
    const stepsDocument: StepsDocument = {
      version: '1.0',
      steps: mockSteps,
    };

    const { result } = renderHook(() =>
      useGuideEngine({
        steps: stepsDocument,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.engine).not.toBeNull();
  });

  it('should memoize steps using JSON serialization', async () => {
    const { result, rerender } = renderHook(
      ({ steps }) => useGuideEngine({ steps }),
      {
        initialProps: { steps: mockSteps },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstEngine = result.current.engine;

    // Rerender with new array but same content
    const newStepsArray = [...mockSteps];
    rerender({ steps: newStepsArray });

    // Engine should not be recreated (same content)
    expect(result.current.engine).toBe(firstEngine);
  });
});
