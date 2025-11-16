/**
 * JSON Schema validation for step definitions using AJV
 */

import Ajv, { type ValidateFunction } from 'ajv';
import type { StepsDocument } from './types.js';
import stepsSchema from '../../../schemas/steps.schema.json';

const ajv = new Ajv({ allErrors: true, strict: true });

let validateSteps: ValidateFunction<StepsDocument> | null = null;

/**
 * Initialize the validator (loads schema)
 */
export function initValidator(): void {
  validateSteps = ajv.compile<StepsDocument>(stepsSchema);
}

/**
 * Validate a steps document against the JSON schema
 */
export function validateStepsDocument(doc: unknown): {
  valid: boolean;
  errors: string[] | null;
  data: StepsDocument | null;
} {
  if (!validateSteps) {
    initValidator();
  }

  const valid = validateSteps!(doc);

  if (valid) {
    return {
      valid: true,
      errors: null,
      data: doc as StepsDocument,
    };
  }

  const errors = validateSteps!.errors?.map((err) => {
    const path = err.instancePath || 'root';
    return `${path}: ${err.message}`;
  });

  return {
    valid: false,
    errors: errors || ['Unknown validation error'],
    data: null,
  };
}
