/**
 * Tests for GuideEngine core functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuideEngine } from '../../packages/sdk-core/src/guide-engine.js';
import { TelemetryClient } from '../../packages/sdk-core/src/telemetry.js';
import type { StepsDocument } from '../../packages/sdk-core/src/types.js';

describe('GuideEngine', () => {
  const sampleSteps: StepsDocument = {
    version: '1.0',
    steps: [
      {
        id: 'step-1',
        type: 'tooltip',
        selector: '#target',
        content: {
          body: 'Test tooltip',
        },
        when: {
          errorId: 'ERR_001',
        },
      },
      {
        id: 'step-2',
        type: 'banner',
        content: {
          title: 'Warning',
          body: 'Test banner',
        },
        when: {
          pathRegex: '/dashboard.*',
        },
      },
    ],
  };

  let engine: GuideEngine;
  let telemetryClient: TelemetryClient;

  beforeEach(() => {
    telemetryClient = new TelemetryClient({ useMock: true });
    engine = new GuideEngine({
      steps: sampleSteps,
      telemetryClient,
    });
  });

  describe('initialization', () => {
    it('should load and validate steps', () => {
      const steps = engine.getSteps();
      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe('step-1');
    });

    it('should throw error for invalid steps', () => {
      const invalidSteps = {
        version: '1.0',
        steps: [
          {
            id: 'invalid',
            type: 'tooltip',
            // missing required fields
          },
        ],
      };

      expect(() => {
        new GuideEngine({
          steps: invalidSteps as any,
          telemetryClient,
        });
      }).toThrow();
    });
  });

  describe('resolveActiveSteps', () => {
    it('should resolve steps matching errorId', async () => {
      const activeSteps = await engine.resolveActiveSteps(
        { errorId: 'ERR_001' },
        { path: '/' }
      );

      expect(activeSteps).toHaveLength(1);
      expect(activeSteps[0].id).toBe('step-1');
    });

    it('should resolve steps matching pathRegex', async () => {
      const activeSteps = await engine.resolveActiveSteps(
        {},
        { path: '/dashboard/home' }
      );

      expect(activeSteps).toHaveLength(1);
      expect(activeSteps[0].id).toBe('step-2');
    });

    it('should resolve multiple matching steps', async () => {
      const activeSteps = await engine.resolveActiveSteps(
        { errorId: 'ERR_001' },
        { path: '/dashboard/home' }
      );

      expect(activeSteps).toHaveLength(2);
    });

    it('should return empty array when no steps match', async () => {
      const activeSteps = await engine.resolveActiveSteps(
        { errorId: 'UNKNOWN' },
        { path: '/other' }
      );

      expect(activeSteps).toHaveLength(0);
    });
  });

  describe('callback management', () => {
    it('should register and invoke callbacks', async () => {
      const mockCallback = vi.fn();
      engine.registerCallback('test-callback', mockCallback);

      await engine.invokeCallback('test-callback', { data: 'test' });

      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should warn when callback not found', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await engine.invokeCallback('non-existent', {});

      expect(consoleSpy).toHaveBeenCalledWith('Callback not found: non-existent');
      consoleSpy.mockRestore();
    });
  });

  describe('lifecycle events', () => {
    it('should track active steps on show', async () => {
      const step = sampleSteps.steps[0];

      await engine.onStepShow(step);

      const activeIds = engine.getActiveStepIds();
      expect(activeIds).toContain('step-1');
    });

    it('should remove active steps on dismiss', async () => {
      const step = sampleSteps.steps[0];

      await engine.onStepShow(step);
      await engine.onStepDismiss(step);

      const activeIds = engine.getActiveStepIds();
      expect(activeIds).not.toContain('step-1');
    });

    it('should invoke callbacks on show', async () => {
      const mockCallback = vi.fn();
      const stepWithCallback: StepsDocument = {
        version: '1.0',
        steps: [
          {
            id: 'step-with-callback',
            type: 'tooltip',
            content: { body: 'Test' },
            when: {},
            actions: {
              onShow: 'show-callback',
            },
          },
        ],
      };

      const testEngine = new GuideEngine({
        steps: stepWithCallback,
        telemetryClient,
      });
      testEngine.registerCallback('show-callback', mockCallback);

      await testEngine.onStepShow(stepWithCallback.steps[0]);

      expect(mockCallback).toHaveBeenCalled();
    });
  });
});
