import { describe, expect, it } from 'vitest';
import { parseServerEnv } from './index.js';

describe('parseServerEnv', () => {
  it('validates portable service URLs', () => {
    const env = parseServerEnv({
      DATABASE_URL:
        'postgresql://u:p@ep-example-pooler.ap-southeast-1.aws.neon.tech/db?sslmode=require',
      DIRECT_URL:
        'postgresql://u:p@ep-example.ap-southeast-1.aws.neon.tech/db?sslmode=require',
      REDIS_URL: 'rediss://default:secret@example.upstash.io:6379',
    });
    expect(env.API_PORT).toBe(4000);
    expect(env.DIRECT_URL).toContain('ep-example.ap-southeast-1.aws.neon.tech');
  });

  it('rejects an HTTP Redis REST URL', () => {
    expect(() =>
      parseServerEnv({
        DATABASE_URL: 'postgresql://u:p@example.neon.tech/db',
        REDIS_URL: 'https://example.upstash.io',
      }),
    ).toThrow(/redis:\/\/ or rediss:\/\//);
  });
});
