/**
 * Tests for condition evaluator
 */

import { describe, it, expect } from 'vitest';
import { evaluateConditions } from '../../packages/sdk-core/src/evaluator.js';
import type { Conditions, EvaluationContext } from '../../packages/sdk-core/src/types.js';

describe('evaluateConditions', () => {
  const baseContext: EvaluationContext = {
    telemetry: {
      errorId: 'AUTH_401',
      errorCode: 'UNAUTHORIZED',
    },
    route: {
      path: '/dashboard',
    },
  };

  it('should match when errorId matches (string)', () => {
    const conditions: Conditions = {
      errorId: 'AUTH_401',
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should match when errorId matches (array)', () => {
    const conditions: Conditions = {
      errorId: ['AUTH_401', 'AUTH_403'],
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should not match when errorId does not match', () => {
    const conditions: Conditions = {
      errorId: 'NETWORK_ERROR',
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(false);
  });

  it('should match when pathRegex matches', () => {
    const conditions: Conditions = {
      pathRegex: '/dashboard',
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should match when pathRegex is a pattern', () => {
    const conditions: Conditions = {
      pathRegex: '/dash.*',
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should not match when pathRegex does not match', () => {
    const conditions: Conditions = {
      pathRegex: '/settings',
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(false);
  });

  it('should match with equals predicate', () => {
    const conditions: Conditions = {
      customExpr: {
        op: 'equals',
        field: 'telemetry.errorCode',
        value: 'UNAUTHORIZED',
      },
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should match with notEquals predicate', () => {
    const conditions: Conditions = {
      customExpr: {
        op: 'notEquals',
        field: 'telemetry.errorCode',
        value: 'FORBIDDEN',
      },
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should match with and predicate', () => {
    const conditions: Conditions = {
      customExpr: {
        op: 'and',
        operands: [
          {
            op: 'equals',
            field: 'telemetry.errorId',
            value: 'AUTH_401',
          },
          {
            op: 'equals',
            field: 'route.path',
            value: '/dashboard',
          },
        ],
      },
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should not match with and predicate when one condition fails', () => {
    const conditions: Conditions = {
      customExpr: {
        op: 'and',
        operands: [
          {
            op: 'equals',
            field: 'telemetry.errorId',
            value: 'AUTH_401',
          },
          {
            op: 'equals',
            field: 'route.path',
            value: '/settings',
          },
        ],
      },
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(false);
  });

  it('should match with or predicate', () => {
    const conditions: Conditions = {
      customExpr: {
        op: 'or',
        operands: [
          {
            op: 'equals',
            field: 'telemetry.errorId',
            value: 'NETWORK_ERROR',
          },
          {
            op: 'equals',
            field: 'route.path',
            value: '/dashboard',
          },
        ],
      },
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should match with contains predicate (string)', () => {
    const conditions: Conditions = {
      customExpr: {
        op: 'contains',
        field: 'route.path',
        value: 'dash',
      },
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });

  it('should match all conditions together', () => {
    const conditions: Conditions = {
      errorId: 'AUTH_401',
      pathRegex: '/dash.*',
      customExpr: {
        op: 'equals',
        field: 'telemetry.errorCode',
        value: 'UNAUTHORIZED',
      },
    };

    expect(evaluateConditions(conditions, baseContext)).toBe(true);
  });
});
