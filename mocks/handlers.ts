/**
 * MSW (Mock Service Worker) request handlers for telemetry API
 */

import { http, HttpResponse } from 'msw';
import mockData from './telemetry.json';

export const handlers = [
  // Fetch telemetry data
  http.post('/api/telemetry', async ({ request }) => {
    const context = await request.json() as Record<string, unknown>;

    // Return mock telemetry context
    return HttpResponse.json({
      errorId: context.errorId || 'AUTH_401',
      errorCode: 'UNAUTHORIZED',
      userId: 'mock-user-123',
      sessionId: 'mock-session-456',
      ...context,
    });
  }),

  // Emit telemetry event
  http.post('/api/telemetry/emit', async ({ request }) => {
    const event = await request.json() as Record<string, unknown>;

    console.log('[MSW] Telemetry event emitted:', event);

    return HttpResponse.json({
      success: true,
      eventId: `event-${Date.now()}`,
    });
  }),

  // Get mock errors list
  http.get('/api/telemetry/errors', () => {
    return HttpResponse.json(mockData.errors);
  }),

  // Get mock events list
  http.get('/api/telemetry/events', () => {
    return HttpResponse.json(mockData.events);
  }),
];
