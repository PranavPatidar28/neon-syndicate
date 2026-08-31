import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';
describe('HealthController', () => {
  it('reports healthy', () => {
    expect(new HealthController().health()).toEqual({
      service: 'api',
      status: 'ok',
    });
  });
});
