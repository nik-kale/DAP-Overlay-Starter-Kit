/**
 * Condition evaluation logic
 * Safely evaluates predicate expressions without using eval()
 */

import type { Conditions, EvaluationContext, PredicateExpression } from './types.js';
import { safeRegexTest } from './security.js';

/**
 * Maximum depth for nested predicate expressions
 * Prevents stack overflow from deeply nested expressions
 */
const MAX_PREDICATE_DEPTH = 50;

/**
 * Get a nested field value from an object using dot notation
 */
function getFieldValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Evaluate a single predicate expression
 */
function evaluatePredicate(
  expr: PredicateExpression,
  context: EvaluationContext,
  depth: number = 0
): boolean {
  // Check depth limit to prevent stack overflow
  if (depth > MAX_PREDICATE_DEPTH) {
    console.error(
      `[DAP Overlay] Predicate evaluation depth limit (${MAX_PREDICATE_DEPTH}) exceeded. ` +
      'This may indicate a circular or excessively nested condition.'
    );
    return false;
  }
  switch (expr.op) {
    case 'equals': {
      if (!expr.field) return false;
      const fieldValue = getFieldValue(context, expr.field);
      return fieldValue === expr.value;
    }

    case 'notEquals': {
      if (!expr.field) return false;
      const fieldValue = getFieldValue(context, expr.field);
      return fieldValue !== expr.value;
    }

    case 'contains': {
      if (!expr.field) return false;
      const fieldValue = getFieldValue(context, expr.field);
      if (typeof fieldValue === 'string' && typeof expr.value === 'string') {
        return fieldValue.includes(expr.value);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(expr.value);
      }
      return false;
    }

    case 'greaterThan': {
      if (!expr.field) return false;
      const fieldValue = getFieldValue(context, expr.field);
      if (typeof fieldValue === 'number' && typeof expr.value === 'number') {
        return fieldValue > expr.value;
      }
      return false;
    }

    case 'lessThan': {
      if (!expr.field) return false;
      const fieldValue = getFieldValue(context, expr.field);
      if (typeof fieldValue === 'number' && typeof expr.value === 'number') {
        return fieldValue < expr.value;
      }
      return false;
    }

    case 'and': {
      if (!expr.operands || expr.operands.length === 0) return false;
      return expr.operands.every((op) => {
        // Validate operand before recursion
        if (!op || typeof op !== 'object' || !op.op) {
          console.warn('[DAP Overlay] Invalid operand in "and" expression:', op);
          return false;
        }
        return evaluatePredicate(op, context, depth + 1);
      });
    }

    case 'or': {
      if (!expr.operands || expr.operands.length === 0) return false;
      return expr.operands.some((op) => {
        // Validate operand before recursion
        if (!op || typeof op !== 'object' || !op.op) {
          console.warn('[DAP Overlay] Invalid operand in "or" expression:', op);
          return false;
        }
        return evaluatePredicate(op, context, depth + 1);
      });
    }

    case 'not': {
      if (!expr.operands || expr.operands.length !== 1) return false;
      const operand = expr.operands[0];
      // Validate operand before recursion
      if (!operand || typeof operand !== 'object' || !operand.op) {
        console.warn('[DAP Overlay] Invalid operand in "not" expression:', operand);
        return false;
      }
      return !evaluatePredicate(operand, context, depth + 1);
    }

    default:
      return false;
  }
}

/**
 * Evaluate all conditions for a step
 */
export function evaluateConditions(conditions: Conditions | undefined, context: EvaluationContext): boolean {
  if (!conditions) {
    return false;
  }

  // Validate that at least one condition is specified (prevent empty condition objects)
  const hasConditions = Boolean(
    conditions.pathRegex || conditions.errorId || conditions.customExpr
  );

  if (!hasConditions) {
    console.warn('[DAP Overlay] Empty conditions object - step will never match. Please specify at least one condition.');
    return false;
  }

  let matches = true;

  // Check errorId condition
  if (conditions.errorId) {
    const errorIds = Array.isArray(conditions.errorId)
      ? conditions.errorId
      : [conditions.errorId];
    const contextErrorId = context.telemetry?.errorId;

    if (!contextErrorId || !errorIds.includes(contextErrorId)) {
      matches = false;
    }
  }

  // Check pathRegex condition with ReDoS protection
  if (matches && conditions.pathRegex) {
    const result = safeRegexTest(conditions.pathRegex, context.route.path);
    if (result === null || result === false) {
      matches = false;
    }
  }

  // Check custom expression
  if (matches && conditions.customExpr) {
    matches = evaluatePredicate(conditions.customExpr, context);
  }

  return matches;
}
