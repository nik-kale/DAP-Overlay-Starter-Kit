/**
 * Tests for TelemetryClient
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TelemetryClient } from '../../packages/sdk-core/src/telemetry.js';

describe('TelemetryClient', () => {
  let client: TelemetryClient;

  beforeEach(() => {
    client = new TelemetryClient({ useMock: true });
  });

  describe('mock mode', () => {
    it('should return mock data in mock mode', async () => {
      const context = await client.fetchTelemetry({ userId: '123' });

      expect(context).toBeDefined();
      expect(context.userId).toBe('123');
    });

    it('should merge mock data with context', async () => {
      const clientWithMock = new TelemetryClient({
        useMock: true,
        mockData: { errorId: 'MOCK_ERROR' },
      });

      const context = await clientWithMock.fetchTelemetry({ userId: '456' });

      expect(context.errorId).toBe('MOCK_ERROR');
      expect(context.userId).toBe('456');
    });

    it('should log events in mock mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await client.emit('test_event', { data: 'test' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('mode switching', () => {
    it('should switch between mock and real mode', () => {
      client.setMockMode(false);
      // Should not throw
      expect(client).toBeDefined();
    });

    it('should update mock data', () => {
      client.setMockMode(true, { newData: 'value' });
      // Should not throw
      expect(client).toBeDefined();
    });

    it('should update base URL', () => {
      client.setBaseUrl('https://new-api.example.com');
      // Should not throw
      expect(client).toBeDefined();
    });
  });
});
