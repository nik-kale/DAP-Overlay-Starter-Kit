/**
 * MSW server setup for Node.js (testing)
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

export const server = setupServer(...handlers);
