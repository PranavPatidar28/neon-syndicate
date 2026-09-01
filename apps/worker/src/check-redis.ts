import Redis from 'ioredis';

async function checkRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is missing. Add the managed Redis URL to .env.');
  }

  const protocol = new URL(redisUrl).protocol;
  if (protocol !== 'redis:' && protocol !== 'rediss:') {
    throw new Error(
      'REDIS_URL must be a redis:// or rediss:// URL, not an HTTPS REST URL.',
    );
  }

  const redis = new Redis(redisUrl, {
    connectTimeout: 5_000,
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  try {
    await redis.connect();
    const response = await redis.ping();
    if (response !== 'PONG')
      throw new Error('Redis returned an invalid PING response.');
    console.info('Managed Redis connection verified.');
  } finally {
    if (redis.status === 'ready') await redis.quit();
    else redis.disconnect();
  }
}

void checkRedis().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown Redis error.';
  console.error(`Redis connection failed: ${message}`);
  process.exitCode = 1;
});
