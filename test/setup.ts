/**
 * Vitest global setup
 */

import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/server.js';
import * as React from 'react';
import '@testing-library/jest-dom/vitest';

// Make React available globally for JSX in tests
(global as any).React = React;

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});
