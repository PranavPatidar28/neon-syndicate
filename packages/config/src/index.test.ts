import { describe, expect, it } from 'vitest';
import { parseServerEnv } from './index.js';
describe('parseServerEnv', () => {
  it('validates portable service URLs', () => {
    const env = parseServerEnv({
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
    });
    expect(env.API_PORT).toBe(4000);
  });
});
