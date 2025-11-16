/**
 * Tests for JSON schema validator
 */

import { describe, it, expect } from 'vitest';
import { validateStepsDocument } from '../../packages/sdk-core/src/validator.js';

describe('validateStepsDocument', () => {
  it('should validate a valid steps document', () => {
    const doc = {
      version: '1.0',
      steps: [
        {
          id: 'test-step',
          type: 'tooltip',
          selector: '#target',
          content: {
            body: 'Test message',
          },
          when: {
            errorId: 'TEST_ERROR',
          },
        },
      ],
    };

    const result = validateStepsDocument(doc);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeNull();
    expect(result.data).toEqual(doc);
  });

  it('should reject document with missing version', () => {
    const doc = {
      steps: [],
    };

    const result = validateStepsDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should reject step with missing required fields', () => {
    const doc = {
      version: '1.0',
      steps: [
        {
          id: 'test-step',
          type: 'tooltip',
          // missing content and when
        },
      ],
    };

    const result = validateStepsDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should reject step with invalid type', () => {
    const doc = {
      version: '1.0',
      steps: [
        {
          id: 'test-step',
          type: 'invalid-type',
          content: {
            body: 'Test',
          },
          when: {},
        },
      ],
    };

    const result = validateStepsDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should validate step with all optional fields', () => {
    const doc = {
      version: '1.0',
      steps: [
        {
          id: 'test-step',
          type: 'tooltip',
          selector: '#target',
          content: {
            title: 'Test Title',
            body: 'Test message',
            allowHtml: true,
          },
          when: {
            errorId: ['ERROR_1', 'ERROR_2'],
            pathRegex: '/test.*',
            customExpr: {
              op: 'equals',
              field: 'test.field',
              value: 'test',
            },
          },
          popper: {
            placement: 'bottom',
            strategy: 'fixed',
            offset: [0, 10],
          },
          actions: {
            onShow: 'showCallback',
            onDismiss: 'dismissCallback',
            cta: {
              label: 'Click me',
              callbackId: 'ctaCallback',
              dismissOnClick: false,
            },
          },
          telemetry: {
            onShowEvent: 'show_event',
            onDismissEvent: 'dismiss_event',
            onCtaClickEvent: 'cta_event',
          },
        },
      ],
    };

    const result = validateStepsDocument(doc);
    expect(result.valid).toBe(true);
  });
});
